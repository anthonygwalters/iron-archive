# Iron Archive — Front-Facing Model

This document describes **what the site is, from the reader's and contributor's point
of view** — the entities, how they relate, and the rules that make a contribution
worth trusting. It deliberately says nothing about file layout, schemas, IDs, or
storage; that lives in the structure/build design and is captured separately. When
the two disagree, this document describes the *intent* and the structure serves it.

See [CLAUDE.md](../CLAUDE.md) for the project charter and its non-negotiables.

---

## 1. Principles carried from the charter

Everything below obeys these:

- **The floor is the whole problem.** A contribution should be a small act by a gym
  person with a phone, not a developer touching Git. Almost every field is optional.
- **Unknowns are rendered, not hidden.** A missing value is shown as a visible
  *"unknown — know this? add it →"* affordance. Visible holes are the recruiting
  mechanism.
- **Provenance is field-level.** Every measured value carries who, when, how, and how
  sure. A submission is a patch touching one or two facts, not a whole record.
- **Nothing is collapsed or overwritten.** Disagreements are shown openly; contested
  values are kept side by side, never averaged away or resolved by last-write-wins.

---

## 2. The page model: nameplate → generations → unsorted

A page is organized like a Wikipedia automobile article. "Toyota Camry" is one page,
but each generation is effectively a different car, shown as its own section.

- **A page is a *nameplate*** — a brand + model (e.g. *Nautilus Pullover*). This is the
  stable, browsable, nameable thing. It is what a contributor can reliably identify,
  even when they know nothing else. It holds the low-controversy attributes that
  persist across the whole lineage: name, what it works, a lead photo, and links to
  related machines.

- **Within a nameplate live *generations*** — each effectively a different machine: its
  era/years, its cam or pad revision, its own photos, and its own headline measurements.
  A generation may override a nameplate attribute on the rare occasion the design
  changed (e.g. a model that switched from plate-loaded to selectorized).

- **Every nameplate has an *unsorted* bucket** — observations, photos, sightings, and
  documents that are not yet pinned to a generation. This is a first-class, rendered
  section, not a hidden staging area, and it carries the *"which generation is this?
  help identify →"* affordance. This is where the knowledge that lives only in
  old-timers' heads gets crystallized.

**Why this shape:** contributors almost never know the generation at submission time —
and this site may become the *only* place that answer exists. Forcing a generation up
front would raise the floor exactly where users are weakest. Instead, generation
identification is itself a valuable, crowdsourced act: you attach loosely to the
nameplate, and an expert refines it into the right generation later.

---

## 3. Machine identity and classification

**Identity:** brand · model · generation (era/years + who owned the brand at the time).
A record with just a photo and a guessed model name is a legitimate, publishable
**stub** — an anchor others attach facts to.

**What it works** — two complementary fields:
- `region` — a coarse, closed, multi-value **browse filter**. The vocabulary is
  machine-real, not a bodybuilding split: `chest`, `back`, `shoulders`, `arms`,
  `legs`, `glutes`, `hamstrings`, `calves`, `hips` (abduction/adduction),
  `lower-back`, `neck`, `traps`, `core`, `full-body`, `other`.
- `movement` — optional free text for precision and the genuinely esoteric
  (e.g. "iso-lateral decline press", "4-way neck"). This is where nuance goes so the
  filter can stay coarse and validatable.

**How it loads and its form** — two separate axes, because they are genuinely
independent (a functional trainer is *cable* in form and *selectorized* in loading):
- `loading` (closed, multi-value): `selectorized` (pin stack) · `plate-loaded` ·
  `pneumatic` · `hydraulic` · `assisted` · `other`.
- `form_factor` (closed): `lever/cam` · `cable` · `smith` · `pendulum` · `other`.

`loading` matters beyond browsing: **it decides which headline fact a page leads with.**

---

## 4. The headline facts (mechanism-dependent)

The project exists to capture the numbers nobody publishes. There is no single such
number for all machines — the right one depends on how the machine loads. Each page
leads with the fact its `loading` type calls for:

| Loading type | Headline fact(s) |
|---|---|
| selectorized | **starting weight** (pin at lowest plate, incl. carriage + linkage), stack range, increment, and **stack unit (lb / kg)** |
| plate-loaded (lever/cam) | **leverage as (ROM-position, ratio) points** — the strength *curve*, not one number |
| cable | **pulley ratio** (e.g. a 2:1 column: 200 lb selected = 100 lb at the handle), increment, stack range/unit |
| smith | **counterbalance** (net bar weight) and bar-path angle |
| assisted | **assist range** — note this is *inverted*: more pin = less effort |

**Measurement protocol (unchanged from the charter):** crane or luggage scale, a
**stated ROM position**, three trials, stored individually — never a pre-average. A
measurement without a stated ROM position is not a fact and is not accepted. For
cam/lever machines, a single leverage number is a lie because the whole point of a cam
is a *varying* curve — so leverage is stored as multiple (ROM-position, ratio) points.

---

## 5. Relationships between records

Machines in this world are not islands — they have lineages and doppelgängers:

- **`family` / `remake_of`** — the same lineage across eras (the DeLand original, the
  '80s build, and the 2010s remake of the Nautilus Pullover are linked but distinct).
- **`rebrand_of` / `same_as`** — clones and OEM rebrands. Half the "brands" on a
  commercial floor are the same casting under a different shroud. For a *discontinued*
  archive this is close to a headline feature: the surviving unit is often the clone,
  and "what is this no-name machine *really*?" is the question people arrive with.

---

## 6. Contested values and provenance

Every measured value carries its own provenance: who contributed it, when, the source,
the ROM position, the individual trials, and a **confidence** drawn from a closed set:
`measured` · `manufacturer` · `estimated` · `disputed`. The closed set exists so a
reader can filter to "measured values only" at build time.

When two people measure the same fact **on the same generation** and disagree, both
values are shown side by side and flagged for a tiebreak — never averaged, never
overwritten. Disagreement *across* generations is not a conflict at all; it is simply
two facts in two sections. (Scoping "contested" to within a generation is a large part
of why the generation model matters.)

---

## 7. Sightings — "where does this iron still exist?"

A sighting records: *this machine was seen at this gym on this date.* It is the
emotional core of a discontinued-machine archive — the treasure-map layer.

- **Fields:** place · date seen · reporter · optional photo · optional note ·
  **optional measurement** (the person standing at the machine with a luggage scale
  *is* the sighting).
- **Place is pinned to a stable geographic identity, not a name string** — gyms
  rebrand and chains reuse names across cities, so a name alone fragments the record.
- **There is deliberately no "condition" field.** Condition changes too fast to be
  useful and invites present-tense claims that go stale and expose the project. A
  sighting is a *dated historical fact* ("seen here on this date"), never a claim about
  the present.
- **The most-recent sighting is surfaced prominently**, with the honest caveat
  *"seen [date] — may be gone."* That honesty is both the shareable feature and the
  legal posture.

A sighting's photo is often the exact evidence that later lets someone assign the
machine's generation — the loop closes on itself.

---

## 8. Gyms and reverse pages

Because places are canonical, sightings roll up into a **gym page**: *machines reported
at this gym* — dated, historical, never present-tense. It's a delightful "what's at my
gym" view and a second way into the archive.

Framing keeps it safe: dated facts, attributed to a reporter, about *machines at a
business* (never about people). A visible *"this looks wrong — flag it"* affordance
gives gyms and anyone else a correction and takedown path. Naming a commercial gym to
state a fact about it is ordinary nominative use.

---

## 9. Documents — the evidence layer

Documentation is not a side table; it is the evidence that grounds measurements and
resolves generations. For an archive whose reason to exist is *"no manufacturer docs
survive,"* a surfaced manual is among the highest-value contributions possible.

**Document types (`doc_type`):** `manual` · `catalog/brochure` · `advertisement`
(vintage muscle-mag ads are prime dating evidence) · `vendor-page` · `patent`
(Nautilus/Arthur Jones cam patents are real primary sources) · `spec-sheet` ·
`article` · `forum` · `video` · `other`.

**A document attaches at any level** — nameplate, a specific generation, or the
unsorted bucket — using the same attach-loosely-refine-later flow as everything else.
A dated manual in the unsorted pile is often precisely what lets an expert perform the
generation split.

**Documents are the citation library.** A measurement's or a generation assignment's
`source` can cite a document instead of a loose string ("this is the '98 gen — source:
[1998 catalog scan]"). This stays progressive: a free-text "forum post" can be upgraded
into a real linked document later; citations are never *required* to be documents.

### Hosting and copyright posture

Uploading scanned manuals and catalogs reproduces copyrighted material, and this is a
public project — so the posture is **link-first**, with a tier ladder:

1. **Link to an existing host** — manufacturer page, archive.org, an existing scan.
   No exposure. Always preferred.
2. **Contributor self-hosts, then links** — for orphaned docs with no home. The site
   **recommends [archive.org](https://archive.org)**: it's free, durable, purpose-built
   for this, and its mission matches the project's. Google Drive / Dropbox / a personal
   site are acceptable but flagged as rot-prone (a dead link to the only surviving
   manual is the exact failure the archive exists to prevent).
3. **Project-hosted upload** — a last resort for a document that would otherwise be lost,
   into the project's own storage, with a visible takedown path.

Additional rules: **never re-host a currently-sold machine's manual** — link the live
vendor page instead. Every document notes which tier it is and carries a
`rights`/`source` field, so the provenance is honest about where the bytes actually
live. (A durability backstop — auto-saving a Wayback snapshot of every linked
document at intake — is noted for the build phase.)

---

## 10. Editorial primitives

The nameplate/generation model requires two reorganizing operations to be first-class,
not hacks:

- **Split** — a nameplate accumulates observations that clearly come from two different
  machines; an editor splits the unsorted pile into distinct generation sections.
- **Merge** — two guessed nameplates turn out to be the same machine; the pages merge.

**Generation assignment is itself a soft, sourced observation**, not a hard fact: who
assigned a machine to a generation, on what evidence, and how sure. A machine may sit
in "unsorted" indefinitely, and disagreements about its generation are shown with the
same honesty as contested measurements. This keeps the crowdsourced-identification
story as trustworthy as the measurement story.

---

## 11. What's deliberately out of scope

- **Condition / liveness on sightings** — too fast-changing and legally fraught. If
  liveness is ever wanted, derive a machine-level *presence* signal at build time from
  the age of the most recent sighting; never a per-sighting field.
- **Granular per-muscle targeting as a validated field** — subjective and contested;
  it belongs in free-text `movement`, not the closed `region` filter.
- **Runtime queries** — search and filtering are build-time; the site stays static.

---

## 12. Banked for the structure phase

Front-facing decisions above are settled. The following are known and intentionally
deferred to the storage/build design: where sightings physically live and how they
reference machines and gyms without a database; immutable IDs vs. mutable slugs and
rename safety; canonical place identity and referential integrity; the concrete
validation split between JSON Schema and custom checks; the photo/document
upload-and-storage path (the least-specified area, deserving its own spec); and
auto-merge policy for low-risk sighting additions.
