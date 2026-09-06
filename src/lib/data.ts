// Build-time data layer. Reads the YAML records (validated separately by
// scripts/validate.py + checks.py) and builds the indexes the pages render from.
//
// In production the site renders data/. Set IRON_DEV_FIXTURES=1 to also include
// tests/fixtures/* so templates can be previewed before real records exist.
import fs from "node:fs";
import fg from "fast-glob";
import { parse } from "yaml";

const ROOT = process.cwd();
const USE_FIXTURES = process.env.IRON_DEV_FIXTURES === "1";
const ASSETS_BASE =
  process.env.IRON_ASSETS_BASE || "https://pub-db6d4b3c62494f3e8d112f79d7814bf5.r2.dev";

export type Asset = { key: string; caption?: string; credit?: string };
export type Observation = {
  rom?: string;
  trials?: number[];
  value?: number;
  unit?: string;
  source?: string;
  contributor?: string;
  date?: string;
  confidence?: string;
  note?: string;
};
export type Doc = {
  id: string;
  doc_type: string;
  tier: string;
  url?: string;
  file?: Asset;
  title?: string;
  publisher?: string;
  year?: number;
};
export type Generation = {
  id: string;
  label?: string;
  era?: string;
  brand_owner?: string;
  loading?: string[];
  form_factor?: string;
  photos?: Asset[];
  measurements?: Record<string, Observation[]>;
  specs?: Record<string, Observation[]>;
  documents?: Doc[];
};
export type Machine = {
  id: string;
  slug: string;
  status: string;
  brand: string;
  model?: string;
  region?: string[];
  movement?: string;
  loading?: string[];
  form_factor?: string;
  lead_photo?: Asset;
  links?: Record<string, string[]>;
  generations?: Generation[];
  unsorted?: { measurements?: Record<string, Observation[]>; documents?: Doc[]; photos?: Asset[] };
};
export type Gym = { id: string; name: string; address?: string; lat?: number; lon?: number };
export type Sighting = {
  id: string;
  machine_id: string;
  generation_id?: string;
  place_id: string;
  place_name: string;
  date_seen: string;
  reporter: string;
  photo?: Asset;
  note?: string;
};

function read<T>(globs: string[]): T[] {
  const files = fg.sync(globs, { cwd: ROOT, absolute: true });
  return files.map((f) => parse(fs.readFileSync(f, "utf8")) as T).filter(Boolean);
}

const g = (base: string, fixtures: string) =>
  USE_FIXTURES ? [base, fixtures] : [base];

export const machines: Machine[] = read<Machine>(
  g("data/machines/*.yml", "tests/fixtures/machines/*.yml")
).sort((a, b) => `${a.brand} ${a.model ?? ""}`.localeCompare(`${b.brand} ${b.model ?? ""}`));

export const gyms: Gym[] = read<Gym>(g("data/gyms/*.yml", "tests/fixtures/gyms/*.yml"));

export const sightings: Sighting[] = read<Sighting>(
  g("data/sightings/**/*.yml", "tests/fixtures/sightings/*.yml")
);

export const machineBySlug = new Map(machines.map((m) => [m.slug, m]));
export const machineById = new Map(machines.map((m) => [m.id, m]));
export const gymById = new Map(gyms.map((y) => [y.id, y]));

export const sightingsByMachine = new Map<string, Sighting[]>();
for (const s of sightings) {
  const list = sightingsByMachine.get(s.machine_id) ?? [];
  list.push(s);
  sightingsByMachine.set(s.machine_id, list);
}
for (const list of sightingsByMachine.values())
  list.sort((a, b) => (b.date_seen || "").localeCompare(a.date_seen || ""));

export const sightingsByGym = new Map<string, Sighting[]>();
for (const s of sightings) {
  const list = sightingsByGym.get(s.place_id) ?? [];
  list.push(s);
  sightingsByGym.set(s.place_id, list);
}

// Which measured field a page leads with, chosen by how the machine loads.
const HEADLINE: Record<string, string> = {
  selectorized: "starting_weight",
  "plate-loaded": "leverage",
  cable: "pulley_ratio",
  smith: "counterbalance",
  assisted: "assist_range",
  pneumatic: "starting_weight",
  hydraulic: "starting_weight",
};
export function headlineField(loading?: string[]): string | null {
  for (const l of loading ?? []) if (HEADLINE[l]) return HEADLINE[l];
  return null;
}

export const FIELD_LABELS: Record<string, string> = {
  starting_weight: "Starting weight",
  leverage: "Leverage ratio",
  counterbalance: "Counterbalance",
  pulley_ratio: "Pulley ratio",
  assist_range: "Assist range",
  stack_max: "Stack max",
  stack_increment: "Stack increment",
  bar_path_angle: "Bar-path angle",
  dimensions: "Dimensions",
};

export function mean(nums?: number[]): number | null {
  if (!nums || !nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Observations at the same ROM point are the same measurement; >1 = contested.
export function groupByRom(obs: Observation[]): Array<{ rom: string; obs: Observation[] }> {
  const map = new Map<string, Observation[]>();
  for (const o of obs) {
    const k = o.rom ?? "—";
    const l = map.get(k) ?? [];
    l.push(o);
    map.set(k, l);
  }
  return [...map.entries()].map(([rom, obs]) => ({ rom, obs }));
}

export function assetUrl(a?: Asset | null): string | null {
  return a?.key ? `${ASSETS_BASE}/${a.key}` : null;
}

export function displayValue(o: Observation): string {
  const v = o.value ?? mean(o.trials);
  if (v == null) return "—";
  const rounded = Math.round(v * 100) / 100;
  return o.unit && o.unit !== "ratio" ? `${rounded} ${o.unit}` : `${rounded}`;
}
