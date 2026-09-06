import { b64, type Env } from "./lib";

const API = "https://api.github.com";

function gh(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "iron-archive-submit",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });
}

export async function getMainSha(env: Env): Promise<string> {
  const r = await gh(env, `/repos/${env.GITHUB_REPO}/git/ref/heads/main`);
  if (!r.ok) throw new Error(`get main ref: ${r.status} ${await r.text()}`);
  const d = (await r.json()) as { object: { sha: string } };
  return d.object.sha;
}

export async function createBranch(env: Env, branch: string, sha: string): Promise<void> {
  const r = await gh(env, `/repos/${env.GITHUB_REPO}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
  if (!r.ok) throw new Error(`create branch: ${r.status} ${await r.text()}`);
}

/** True if the path already exists on main (used to de-dupe slugs / gyms). */
export async function existsOnMain(env: Env, path: string): Promise<boolean> {
  const r = await gh(env, `/repos/${env.GITHUB_REPO}/contents/${path}?ref=main`);
  return r.ok;
}

/** Read a file's text + blob sha from a ref. Null if it doesn't exist. */
export async function getFile(
  env: Env,
  path: string,
  ref: string
): Promise<{ content: string; sha: string } | null> {
  const r = await gh(env, `/repos/${env.GITHUB_REPO}/contents/${path}?ref=${ref}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`get ${path}: ${r.status} ${await r.text()}`);
  const d = (await r.json()) as { content: string; sha: string };
  const bin = atob(d.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return { content: new TextDecoder().decode(bytes), sha: d.sha };
}

export async function putFile(
  env: Env,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<void> {
  const body: Record<string, unknown> = { message, content: b64(content), branch };
  if (sha) body.sha = sha; // required when updating an existing file
  const r = await gh(env, `/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`put ${path}: ${r.status} ${await r.text()}`);
}

export async function openPR(
  env: Env,
  branch: string,
  title: string,
  body: string
): Promise<string> {
  const r = await gh(env, `/repos/${env.GITHUB_REPO}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, head: branch, base: "main", body }),
  });
  if (!r.ok) throw new Error(`open PR: ${r.status} ${await r.text()}`);
  const d = (await r.json()) as { html_url: string };
  return d.html_url;
}
