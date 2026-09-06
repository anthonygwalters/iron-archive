// Submission endpoints/keys. Override at build with PUBLIC_SUBMIT_URL and
// PUBLIC_TURNSTILE_SITEKEY; the defaults let the forms work before the real
// Worker/Turnstile are provisioned (the sitekey below is Cloudflare's public
// "always passes" TEST key — replace it with the real one for production).
export const SUBMIT_URL =
  import.meta.env.PUBLIC_SUBMIT_URL ??
  "https://iron-archive-submit.a-grayson-walters.workers.dev";
export const TURNSTILE_SITEKEY =
  import.meta.env.PUBLIC_TURNSTILE_SITEKEY ?? "0x4AAAAAAEqaCfd8bkmGsTP-";

export const REGIONS = [
  "chest", "back", "shoulders", "arms", "legs", "glutes", "hamstrings",
  "calves", "hips", "lower-back", "neck", "traps", "core", "full-body", "other",
];
export const LOADINGS = [
  "selectorized", "plate-loaded", "pneumatic", "hydraulic", "assisted", "other",
];
export const FORM_FACTORS = ["lever/cam", "cable", "smith", "pendulum", "other"];

export const DOC_TYPES = [
  "manual", "catalog/brochure", "advertisement", "vendor-page", "patent",
  "spec-sheet", "article", "forum", "video", "other",
];

export const LINK_KINDS = [
  { value: "remake_of", label: "This is a remake of…" },
  { value: "family", label: "Same family as…" },
  { value: "rebrand_of", label: "This is a rebrand / clone of…" },
  { value: "same_as", label: "Same as (duplicate nameplate)…" },
];
