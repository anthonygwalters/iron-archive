import { stringify } from "yaml";

export interface Env {
  ASSETS: R2Bucket;
  RATE_LIMIT?: KVNamespace;
  GITHUB_TOKEN: string;
  TURNSTILE_SECRET?: string;
  GITHUB_REPO: string;
  ASSETS_BASE: string;
  ALLOWED_ORIGIN: string;
  NOMINATIM_UA: string;
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A ULID-shaped id: <prefix>_ + 10 time chars + 16 random, Crockford base32. */
export function id(prefix: string): string {
  let t = Date.now();
  const time: string[] = new Array(10);
  for (let i = 9; i >= 0; i--) {
    time[i] = CROCKFORD[t % 32];
    t = Math.floor(t / 32);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const rand = Array.from(bytes, (b) => CROCKFORD[b % 32]);
  return `${prefix}_${time.join("")}${rand.join("")}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "unnamed";
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

/** Base64 of a UTF-8 string (for the GitHub contents API). */
export function b64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function yaml(obj: unknown): string {
  // A leading comment marks machine-generated intake records.
  return "# Submitted via the Iron Archive intake form.\n" + stringify(obj);
}

export async function verifyTurnstile(
  token: string | null,
  ip: string,
  secret?: string
): Promise<boolean> {
  if (!secret) return true; // not configured (dev) -> skip
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token ?? "");
  if (ip) body.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const d = (await r.json()) as { success?: boolean };
  return !!d.success;
}

export async function rateLimit(env: Env, ip: string, max = 10): Promise<boolean> {
  if (!env.RATE_LIMIT || !ip) return true;
  const key = `rl:${ip}`;
  const cur = parseInt((await env.RATE_LIMIT.get(key)) ?? "0", 10);
  if (cur >= max) return false;
  await env.RATE_LIMIT.put(key, String(cur + 1), { expirationTtl: 3600 });
  return true;
}

export interface Place {
  place_id: string;
  name: string;
  address?: string;
  lat?: number;
  lon?: number;
  source: "osm" | "local";
}

/** Resolve a free-text gym query to a canonical place via OpenStreetMap. */
export async function resolvePlace(q: string, env: Env): Promise<Place> {
  if (q) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, {
      headers: { "User-Agent": env.NOMINATIM_UA, Accept: "application/json" },
    });
    if (r.ok) {
      const arr = (await r.json()) as Array<{
        osm_type: string;
        osm_id: number;
        display_name: string;
        lat: string;
        lon: string;
      }>;
      const p = arr?.[0];
      if (p && (p.osm_type === "node" || p.osm_type === "way" || p.osm_type === "relation")) {
        return {
          place_id: `osm_${p.osm_type}_${p.osm_id}`,
          name: p.display_name.split(",")[0].trim(),
          address: p.display_name,
          lat: parseFloat(p.lat),
          lon: parseFloat(p.lon),
          source: "osm",
        };
      }
    }
  }
  // No match (or empty) -> provisional local id, flagged for later reconciliation.
  return { place_id: id("local"), name: q || "Unknown gym", source: "local" };
}
