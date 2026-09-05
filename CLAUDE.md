# Gym Machine Database

A public reference for strength-training machine specifications, especially
discontinued models where no manufacturer documentation survives.

## Why this exists

The facts people actually want are the ones nobody publishes:

- **Starting weight** — the load with the pin at the lowest plate, including
  carriage and linkage. Never in the manual. Always wanted.
- **Leverage ratio** — resistance at the handle divided by selected stack
  weight. The number on the plate is not the load on the muscle. On
  plate-loaded machines the discrepancy is large enough to make cross-gym
  comparison meaningless without it.

Everything else is secondary. If a design decision trades away one of these
two, it's the wrong decision.

## Data model conventions

Records live in `data/machines/*.yml`, one file per machine, slug as filename.

**Almost every field is optional.** Required: `id`, `brand`, and one photo.
`status: stub` is a first-class, publishable state — a photo plus a guessed
model name is a legitimate record. Stubs are anchors other contributors attach
facts to. Do not add required fields without a strong reason; each one raises
the floor on contribution and the floor is the whole problem.

**Provenance is field-level, not record-level.** Each measured value carries
its own `value`, `source`, `contributor`, `date`, and `confidence`. This is
what makes a submission a patch touching one or two fields rather than a whole
record, so two people can fill different holes in the same machine without
colliding.

**Contested values are not resolved by last-write-wins.** Keep an array of
observations and render the disagreement openly on the page. Two measurements
of 12.5 and 15 both display, flagged for a tiebreak. Never silently overwrite
one observation with another, and never collapse an array to a single number
at build time.

**Unknown fields are rendered, not hidden.** A missing value emits a visible
"unknown — measured one? add it" affordance linking to a prefilled form.
Visible holes are the primary recruiting mechanism for contributions; a blank
submission form is not. Treat any change that hides incompleteness as a
regression.

## Measurement protocol

Field measurements follow the documented protocol in `docs/protocol.md`:
crane or luggage scale, defined ROM position, three trials. Records store
individual trials rather than a pre-averaged number so reliability can be
assessed later. Never accept a measurement without an ROM position — a
leverage ratio without a stated measurement point is not a fact.

## Intake flow

Web form → webhook → GitHub Action writes YAML to a branch under
`submissions/` → opens a PR → schema validation runs → human merge. There is
no admin panel and no database; the PR list is the review queue. Keep it that
way. Photos go to object storage; records hold URLs.

Contributors are expected to be gym people with phones, not developers. Any
workflow that requires a contributor to touch Git directly is a fallback path
for the minority, never the primary one.

## Constraints

- Static site. No server, no database, no runtime API.
- Search and filtering are build-time (Pagefind or equivalent). If a feature
  needs a query engine at runtime, redesign the feature.
- Schema changes require updating `data/schema/machine.schema.json` and
  keeping existing records valid. Migrations happen in the repo, not by
  discarding records.
