# Iron Archive

**A public reference for strength-training machine specifications — especially
discontinued models where no manufacturer documentation survives.**

The facts lifters actually want are the ones nobody publishes: a machine's
**starting weight** (the real load with the pin at the lowest plate, carriage and
linkage included) and its **leverage ratio** (what the muscle actually feels — not
the number stamped on the stack). Iron Archive collects them, field-measured and
openly sourced, and never averages the disagreements away.

🔗 **theironarchive.org** (static site) · see [`CLAUDE.md`](CLAUDE.md) for the
project charter and [`docs/model.md`](docs/model.md) for the full data model.

## How it works

- **Static site, no runtime backend.** An [Astro](https://astro.build) build reads
  the YAML records and renders every page; search is build-time
  ([Pagefind](https://pagefind.app)). Hosted on GitHub Pages.
- **Records are data, reviewed as pull requests.** There is no database and no admin
  panel — the PR list *is* the review queue. Contributions arrive through a web form
  that opens a PR; a validation gate must pass before a human merges.
- **Provenance everywhere.** Every measured value carries who/when/how/how-sure.
  Contested values are kept side by side and shown openly, never collapsed.

## The model in one breath

A record is a **nameplate** (brand + model) containing **generations** — each
effectively a different machine, Wikipedia-automobile style — plus an **unsorted**
bucket for observations not yet pinned to a generation. Machines link to each other
(`remake_of`, `rebrand_of`). **Sightings** ("seen at this gym on this date") and
**documents** (manuals, catalogs, ads, patents — link-first) hang off them. Full
detail in [`docs/model.md`](docs/model.md); measurement rules in
[`docs/protocol.md`](docs/protocol.md).

## Repository layout

```
data/
  machines/<slug>.yml            one cohesive record per nameplate
  gyms/<place_id>.yml            canonical places
  sightings/<machine_id>/*.yml   one append-only file per sighting
  schema/*.schema.json           JSON Schema (Draft 2020-12) for each record type
docs/                            charter model, measurement protocol, intake & deploy
scripts/                         validate.py (schema) + checks.py (cross-file integrity)
src/                             the Astro site
tests/fixtures/                  illustrative records (FABRICATED — never real data)
```

## Validation

Two gates run in CI on every PR ([`.github/workflows/validate.yml`](.github/workflows/validate.yml)):

```bash
pip install -r scripts/requirements.txt
python scripts/validate.py      # per-file JSON Schema
python scripts/checks.py        # cross-file: referential integrity, id uniqueness/
                                # immutability, path<->field, alias hygiene, asset safety
```

A bad record cannot merge even if the submission front end has a bug.

## Local development

```bash
npm install
npm run dev              # live preview at localhost:4321
npm run build:fixtures   # build with the example fixtures, so pages have content
```

The production build (`npm run build`) renders `data/` only; with no records yet the
home page shows an honest empty state.

## Contributing

Once the site is live, use the “add / measure one” affordances on the site — they
open a prefilled submission that becomes a PR. Direct PRs against `data/` are welcome
too; they must pass the validation gate above. Please follow
[`docs/protocol.md`](docs/protocol.md) for measurements.

## Status

Early build. Data model, schemas, validation, CI, and the static site are in place;
the submission front end and the first real records are next.

## License

TBD — code and dataset will be licensed separately (an open code license plus an
open-data license for the records). Until then, no license is granted.
