# Intake pipeline

How a contribution becomes a merged record. The **validation gate** (schema +
cross-file checks) is built and runs in CI; the **submission front end** (form →
webhook → PR) is planned here and needs a couple of infra decisions before it's
built.

## The whole path

```
web form  →  webhook (Cloudflare Worker)  →  GitHub API: branch + file + PR
   →  CI gate (validate.py + checks.py)  →  human merge  (auto-merge for sightings)
```

No admin panel, no database. The **PR list is the review queue** (charter). A
contributor never touches Git.

## Built now: the validation gate

`.github/workflows/validate.yml` runs on every PR touching `data/**` (and on
pushes to main):

1. **`scripts/validate.py`** — per-file JSON Schema (Draft 2020-12): required
   fields, closed enums, ROM-required, trials⊻value, id/slug patterns, document
   tier→url/file.
2. **`scripts/checks.py`** — the cross-file rules Schema can't express:
   referential integrity, id uniqueness + immutability (diffed against the PR
   base), path↔field agreement, alias hygiene, asset-key prefix, https-only doc
   links.

Both are green on the fixtures, with negative tests proving each rule bites. This
is the load-bearing part: it means a bad record cannot merge even if the front
end has a bug.

## Planned: the submission front end

The one job here is "turn a form submission into a valid PR." Recommended shape,
because it fits the existing stack (the Voice Organizer already runs on a
Cloudflare Worker):

**A Cloudflare Worker as the form handler + webhook.** On submit it:
1. **Uploads the photo/document** to object storage (**Cloudflare R2**), under a
   key with the `obj/` prefix the checker enforces (`obj/ph_<ulid>.jpg`,
   `obj/doc_<ulid>.pdf`). Records hold the key, never a raw third-party URL.
2. **Mints ids** (ULIDs): `mac_`/`gen_`/`doc_`/`sig_`, and `sig_` names the file.
3. **Resolves the gym** for a sighting via a places lookup (OpenStreetMap /
   Nominatim, per the charter's open-data lean), producing a
   filesystem-safe `place_id` (`osm_node_<n>`); on a miss it mints
   `local_<ulid>` and flags the gym for later reconciliation — never a dead end.
   Creates the `data/gyms/<place_id>.yml` file if it's new.
4. **Renders YAML** for the record (dates quoted, so the YAML-date trap can't
   bite) and, via the GitHub API, creates a branch, commits the file(s), and
   opens a PR.

Then CI runs the gate above and a human merges.

### Auto-merge for sightings
Sightings are append-only new files that are fully machine-checkable (schema +
referential integrity). A follow-up workflow can enable GitHub auto-merge for
PRs that (a) touch only `data/sightings/**` (plus a possible new gym file) and
(b) pass CI — reserving human review for spec/measurement changes. This keeps the
review queue from drowning in low-stakes adds.

### Where the v2 LLM triage slots in
When experience reports arrive (v2), an intake-time model pass (in the Worker or
as a CI step) flags for the human reviewer: condition claims tied to a specific
gym's unit, spam/off-topic, PII. An assist to the queue, never an autonomous
gatekeeper. Tracked in issue #1.

## Open decisions before building the front end

- **GitHub credential:** a fine-grained PAT vs. a GitHub App for the Worker to
  open PRs. (App is cleaner for a public project; PAT is faster to stand up.)
- **Object storage:** confirm Cloudflare R2 (assumed above) vs. alternative.
- **Places resolver:** confirm OpenStreetMap/Nominatim (open-data, matches the
  charter) vs. Google Places (better coverage, paid, key to manage).
- **Spam/abuse on the public form** before it reaches a PR (rate limiting,
  hCaptcha, etc.) — the Worker is the natural place for it.
