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

export async function putFile(
  env: Env,
  path: string,
  content: string,
  message: string,
  branch: string
): Promise<void> {
  const r = await gh(env, `/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: b64(content), branch }),
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
