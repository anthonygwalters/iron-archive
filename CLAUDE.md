# Iron Archive — Charter

A public reference for strength-training machine specifications, especially
discontinued models where no manufacturer documentation survives.

This charter states the mission and the non-negotiable conventions. The full
front-facing model — nameplates, generations, sightings, documents — lives in
[docs/model.md](docs/model.md). When the two agree, this is the summary; when they
disagree, model.md is describing intent and this needs updating.

## Why this exists

The facts people actually want are the ones nobody publishes:

- **Starting weight** — the load with the pin at the lowest plate, including
  carriage and linkage. Never in the manual. Always wanted.
- **Leverage ratio** — resistance at the handle divided by selected stack weight.
  The number on the plate is not the load on the muscle. On plate-loaded machines
  the discrepancy is large enough to make cross-gym comparison meaningless without it.

There is no single "key number" for every machine — the right one depends on how the
machine loads (starting weight for selectorized, a leverage *curve* for cams, pulley
ratio for cables, counterbalance for Smith, assist range for assisted). And leverage
is never one number on a cam: the whole point of a cam is a *varying* strength curve,
so it is stored as multiple (ROM-position, ratio) points. Everything else is
secondary. If a design decision trades away these facts, it's the wrong decision.

## What a record is

A record is a **nameplate** — a brand + model (e.g. *Nautilus Pullover*), the stable
thing a contributor can name even when they know nothing else. Within it:

- **Generations.** Each generation is effectively a different machine (the DeLand
  original vs. the Nitro remake), shown as its own section with its own era, photos,
  and measurements — modeled like the generations on a Wikipedia automobile page.
- **An unsorted bucket.** Observations, photos, and documents not yet pinned to a
  generation live here, rendered openly with a *"which generation is this? help
  identify →"* affordance. Identifying a generation is itself a valuable, crowdsourced
  act — this site may be the only place that answer exists.

Generation assignment is a **soft, sourced observation** (who assigned it, on what
evidence, how sure), not a hard fact. The two reorganizing operations — **split** (one
nameplate is really two machines) and **merge** (two guessed nameplates are one) — are
first-class.

## Data model conventions

- **One cohesive file per nameplate:** `data/machines/<slug>.yml`, with generations,
  measurements, and documents inline. Only high-volume, append-only streams
  (sightings) are decomposed into one file per item. Decomposing further is possible
  later if a real use case demands it; we do not pay that complexity up front.
- **Identity vs. name.** Every record has an immutable, opaque `id` (the reference
  everything points at) and a mutable `slug` (the filename and URL). Renames are the
  *common* case here — contributors guess model names — so old slugs become `aliases`
  that redirect, and no reference ever breaks. References always use the `id`.
- **Almost every field is optional.** Required: `id`, `brand`, and one photo.
  `status: stub` (a photo plus a guessed model name) is a first-class, publishable
  state — an anchor others attach facts to. Do not add required fields without a strong
  reason; each one raises the floor, and the floor is the whole problem.
- **Provenance is field-level.** Each measured value carries its own trials/value, ROM
  position, source, contributor, date, and a `confidence` from a closed set
  (`measured` | `manufacturer` | `estimated` | `disputed`). A submission is a patch
  touching one or two fields, not a whole record.
- **Contested values are not resolved by last-write-wins.** Keep an array of
  observations and render the disagreement openly. Two measurements of 12.5 and 15
  both display, flagged for a tiebreak. Never silently overwrite, and never collapse an
  array to a single number at build time. For leverage, the same array also holds the
  *curve*: multiple ROM points, with any disagreement at a point sitting side by side.
- **Unknown fields are rendered, not hidden.** A missing value emits a visible
  "unknown — measured one? add it" affordance linking to a prefilled form. This extends
  to unknown *generation* (the unsorted bucket). Any change that hides incompleteness
  is a regression.
- **Classification is coarse, closed, and validatable** — never the machine itself,
  only its buckets. All optional:
  - `region` (closed, multi-value): what it works, machine-real — chest, back,
    shoulders, arms, legs, glutes, hamstrings, calves, hips, lower-back, neck, traps,
    core, full-body, other. A browse filter.
  - `movement` (free text): precision and the genuinely esoteric.
  - `loading` (closed, multi-value): selectorized, plate-loaded, pneumatic, hydraulic,
    assisted, other — decides which headline fact a page leads with.
  - `form_factor` (closed): lever/cam, cable, smith, pendulum, other.

  A generation may override a nameplate classification on the rare occasion the design
  changed.
- **Relationships link records by `id`:** `family` / `remake_of` (same lineage across
  eras) and `rebrand_of` / `same_as` (clones and OEM rebrands — for a discontinued
  archive, "what is this no-name machine really?" is close to a headline feature).

## Measurement protocol

Field measurements follow the documented protocol in `docs/protocol.md`: crane or
luggage scale, a defined ROM position, three trials. Records store individual trials
rather than a pre-averaged number so reliability can be assessed later. Never accept a
measurement without an ROM position — a leverage ratio without a stated measurement
point is not a fact. Weight-based facts carry their **stack unit (lb or kg)** on the
measurement; a bare "100" is a market-dependent trap.

## Sightings and places

A sighting records that a machine was seen at a gym on a date — the "where does this
iron still exist?" layer. Sightings are **decomposed**: one file per sighting under
`data/sightings/<machine_id>/`, collision-proof names, append-only, so overlapping
submissions never conflict. Each references a canonical place by a stable `place_id`;
places are normalized in `data/gyms/` (resolved once at intake, so the map is static).
There is deliberately **no condition field** — a sighting is a dated historical fact,
never a present-tense claim about a business, which keeps it honest and out of
defamation territory. The most-recent sighting is surfaced prominently ("seen [date] —
may be gone"). Sightings roll up into a reverse **gym page** (machines reported at this
gym) and carry a visible flag/takedown affordance.

## Documents — the evidence layer

Documentation grounds measurements and resolves generations; for an archive whose
reason to exist is that no manufacturer docs survive, a surfaced manual is among the
highest-value contributions. A document is a link or an upload, typed (`manual`,
`catalog/brochure`, `advertisement`, `vendor-page`, `patent`, `spec-sheet`, `article`,
`forum`, `video`, `other`), and citable as the `source` of a measurement or a
generation assignment. Hosting is **link-first**, in tiers:

1. Link an existing host (manufacturer page, archive.org, an existing scan).
2. Contributor self-hosts and links — **archive.org preferred** for durability;
   Drive/Dropbox/personal acceptable but flagged rot-prone.
3. Project-hosted upload only as a last resort, with a visible takedown path.

Never re-host a currently-sold machine's manual — link the vendor page. Every document
records its tier and rights, so provenance is honest about where the bytes live.

## Intake flow

Web form → webhook → GitHub Action writes YAML to a branch → opens a PR → schema
validation runs → human merge. There is no admin panel and no database; the PR list is
the review queue. Keep it that way. Photos and uploaded documents go to object storage;
records hold keys. Contributors are gym people with phones, not developers — any
workflow that requires touching Git directly is a fallback for the minority, never the
primary path. Sightings, being append-only new files that pass mechanical checks, are
candidates for auto-merge; measurement and spec changes are always reviewed.

## Constraints

- Static site. No server, no database, no runtime API.
- Search and filtering are build-time (Pagefind or equivalent). If a feature needs a
  query engine at runtime, redesign the feature.
- Schema changes require updating `data/schema/machine.schema.json` and keeping
  existing records valid. Migrations happen in the repo, not by discarding records.

## Deferred

Experience reports (Erowid-style subjective use accounts) are deferred to v2; v1
reserves the foundations they need — stable ids, a generic cross-link mechanism, and
the shared object-storage path. Tracked in the issues.
