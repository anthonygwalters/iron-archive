import {
  type Env,
  id,
  slugify,
  today,
  json,
  yaml,
  verifyTurnstile,
  rateLimit,
  resolvePlace,
} from "./lib";
import { getMainSha, createBranch, existsOnMain, putFile, openPR } from "./github";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/")
      return json({ ok: true, service: "iron-archive-submit" }, 200, cors);
    if (request.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

    const ip = request.headers.get("CF-Connecting-IP") ?? "";
    try {
      const form = await request.formData();
      const token = (form.get("cf-turnstile-response") as string) ?? null;
      if (!(await verifyTurnstile(token, ip, env.TURNSTILE_SECRET)))
        return json({ error: "turnstile verification failed" }, 403, cors);
      if (!(await rateLimit(env, ip)))
        return json({ error: "rate limited — try again later" }, 429, cors);

      if (url.pathname === "/machines") return await handleMachine(form, env, cors);
      if (url.pathname === "/sightings") return await handleSighting(form, env, cors);
      return json({ error: "not found" }, 404, cors);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : String(e) }, 500, cors);
    }
  },
};

function str(form: FormData, k: string): string {
  const v = form.get(k);
  return typeof v === "string" ? v.trim() : "";
}
function list(form: FormData, k: string): string[] {
  return form.getAll(k).filter((v): v is string => typeof v === "string" && v.length > 0);
}
function contributor(form: FormData): string {
  const h = str(form, "handle");
  return h ? (h.startsWith("gh:") ? h : `web:${h.replace(/^@/, "")}`) : "web:anonymous";
}

async function uploadPhoto(form: FormData, env: Env): Promise<string | null> {
  const entry = form.get("photo");
  if (!entry || typeof entry === "string") return null;
  const file = entry as File;
  if (file.size === 0) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const key = `obj/${id("ph")}.${ext}`;
  await env.ASSETS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  return key;
}

async function handleMachine(form: FormData, env: Env, cors: Record<string, string>) {
  const brand = str(form, "brand");
  if (!brand) return json({ error: "brand is required" }, 400, cors);
  const model = str(form, "model");

  const photoKey = await uploadPhoto(form, env);
  if (!photoKey) return json({ error: "a photo is required" }, 400, cors);

  // Unique slug: append a short id if the base slug already exists on main.
  let slug = slugify(`${brand} ${model}`.trim());
  if (await existsOnMain(env, `data/machines/${slug}.yml`)) slug = `${slug}-${id("x").slice(2, 8).toLowerCase()}`;

  const record: Record<string, unknown> = {
    schema_version: 1,
    id: id("mac"),
    slug,
    status: "stub",
    brand,
  };
  if (model) record.model = model;
  const region = list(form, "region");
  if (region.length) record.region = region;
  const movement = str(form, "movement");
  if (movement) record.movement = movement;
  const loading = list(form, "loading");
  if (loading.length) record.loading = loading;
  const formFactor = str(form, "form_factor");
  if (formFactor) record.form_factor = formFactor;
  record.lead_photo = { key: photoKey, contributor: contributor(form), date: today() };

  const branch = `submit/machine-${(record.id as string).slice(4).toLowerCase()}`;
  await createBranch(env, branch, await getMainSha(env));
  await putFile(
    env,
    `data/machines/${slug}.yml`,
    yaml(record),
    `Add machine stub: ${brand}${model ? " " + model : ""}`,
    branch
  );
  const prUrl = await openPR(
    env,
    branch,
    `Add machine: ${brand}${model ? " " + model : ""}`,
    `New machine stub submitted via the intake form.\n\nContributor: ${contributor(form)}`
  );
  return json({ ok: true, pr: prUrl }, 200, cors);
}

async function handleSighting(form: FormData, env: Env, cors: Record<string, string>) {
  const machineId = str(form, "machine_id");
  if (!/^mac_[0-9A-HJKMNP-TV-Z]{26}$/.test(machineId))
    return json({ error: "valid machine_id is required" }, 400, cors);
  const dateSeen = str(form, "date_seen") || today();

  const place = await resolvePlace(str(form, "gym"), env);
  const photoKey = await uploadPhoto(form, env);

  const sighting: Record<string, unknown> = {
    schema_version: 1,
    id: id("sig"),
    machine_id: machineId,
    place_id: place.place_id,
    place_name: place.name,
    date_seen: dateSeen,
    reporter: contributor(form),
  };
  const generationId = str(form, "generation_id");
  if (/^gen_[0-9A-HJKMNP-TV-Z]{26}$/.test(generationId)) sighting.generation_id = generationId;
  if (photoKey) sighting.photo = { key: photoKey, contributor: contributor(form), date: dateSeen };
  const note = str(form, "note");
  if (note) sighting.note = note;

  const branch = `submit/sighting-${(sighting.id as string).slice(4).toLowerCase()}`;
  await createBranch(env, branch, await getMainSha(env));

  // Create the gym record if this place is new.
  const gymPath = `data/gyms/${place.place_id}.yml`;
  if (!(await existsOnMain(env, gymPath))) {
    const gym: Record<string, unknown> = {
      schema_version: 1,
      id: place.place_id,
      name: place.name,
      source: place.source,
      date_added: today(),
    };
    if (place.address) gym.address = place.address;
    if (place.lat !== undefined) gym.lat = place.lat;
    if (place.lon !== undefined) gym.lon = place.lon;
    await putFile(env, gymPath, yaml(gym), `Add gym: ${place.name}`, branch);
  }

  await putFile(
    env,
    `data/sightings/${machineId}/${sighting.id}.yml`,
    yaml(sighting),
    `Add sighting at ${place.name}`,
    branch
  );
  const prUrl = await openPR(
    env,
    branch,
    `Sighting: machine at ${place.name}`,
    `Sighting submitted via the intake form.\n\nReporter: ${contributor(form)} · seen ${dateSeen}`
  );
  return json({ ok: true, pr: prUrl }, 200, cors);
}
