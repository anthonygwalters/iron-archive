#!/usr/bin/env python3
"""Cross-file integrity checks that JSON Schema cannot express.

Complements scripts/validate.py (per-file schema). Run schema validation first;
this assumes each file is already individually well-formed.

Checks:
  - Referential integrity: sighting machine_id/place_id/generation_id resolve to
    real records; a generation_id belongs to the referenced machine; machine
    link ids resolve; a `source: doc_...` citation resolves within its record.
  - Uniqueness: machine ids, generation ids, document ids, sighting ids, gym ids
    are each globally unique.
  - Path <-> field agreement (data layout only): machine filename == slug; gym
    filename == id; sighting's parent directory == machine_id.
  - id immutability (with --base-ref): a machine/gym file that existed in the
    base ref must not change its top-level id.
  - Alias hygiene: no alias equals any live slug; aliases are globally unique.
  - Asset/URL safety: every asset `key` starts with the object-store prefix
    'obj/'; every link/self-host document url is https.

Deps: pip install pyyaml
Usage:
  python scripts/checks.py                      # checks data/ (strict paths)
  python scripts/checks.py --fixtures           # checks tests/fixtures/ (flat)
  python scripts/checks.py --base-ref origin/main   # also check id immutability
"""
import argparse
import pathlib
import subprocess
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSET_PREFIX = "obj/"


def disp(p):
    """Path for display: repo-relative when possible, else the path itself."""
    try:
        return p.relative_to(ROOT)
    except ValueError:
        return p


def iter_dicts(obj):
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from iter_dicts(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from iter_dicts(v)


def ids_with_prefix(record, prefix):
    out = []
    for d in iter_dicts(record):
        i = d.get("id")
        if isinstance(i, str) and i.startswith(prefix):
            out.append(i)
    return out


def documents(record):
    return [d for d in iter_dicts(record) if "doc_type" in d]


def sources(record):
    return [d["source"] for d in iter_dicts(record)
            if isinstance(d.get("source"), str)]


def load(dirpath, recursive):
    globber = dirpath.rglob if recursive else dirpath.glob
    return [(p, yaml.safe_load(p.read_text()) or {})
            for p in sorted(globber("*.yml"))]


def git_show(ref, relpath):
    try:
        out = subprocess.run(
            ["git", "show", f"{ref}:{relpath}"],
            cwd=ROOT, capture_output=True, text=True,
        )
        if out.returncode != 0:
            return None  # file did not exist in base
        return yaml.safe_load(out.stdout) or {}
    except Exception:
        return None


def run(base, strict_paths, base_ref):
    errs = []
    machines = load(base / "machines", recursive=False)
    gyms = load(base / "gyms", recursive=False)
    sightings = load(base / "sightings", recursive=True)

    machine_ids, gen_ids, doc_ids, gym_ids, sig_ids = {}, {}, {}, {}, {}
    machine_gens = {}   # machine id -> set of its generation ids
    slugs, aliases = {}, {}

    def note_dup(table, key, path, kind):
        if key in table:
            errs.append(f"duplicate {kind} id '{key}' in {path} and {table[key]}")
        else:
            table[key] = path

    for p, rec in machines:
        rel = disp(p)
        mid = rec.get("id")
        note_dup(machine_ids, mid, rel, "machine")
        gens = ids_with_prefix(rec, "gen_")
        machine_gens[mid] = set(gens)
        for g in gens:
            note_dup(gen_ids, g, rel, "generation")
        for d in ids_with_prefix(rec, "doc_"):
            note_dup(doc_ids, d, rel, "document")

        slug = rec.get("slug")
        if slug in slugs:
            errs.append(f"duplicate slug '{slug}' in {rel} and {slugs[slug]}")
        else:
            slugs[slug] = rel
        for a in rec.get("aliases", []) or []:
            if a in aliases:
                errs.append(f"alias '{a}' used by both {rel} and {aliases[a]}")
            aliases[a] = rel

        # source doc citations must resolve within this record
        local_docs = set(ids_with_prefix(rec, "doc_"))
        for s in sources(rec):
            if s.startswith("doc_") and s not in local_docs:
                errs.append(f"{rel}: source cites unknown document '{s}'")

        if strict_paths and p.stem != slug:
            errs.append(f"{rel}: filename stem != slug '{slug}'")

    for p, rec in gyms:
        rel = disp(p)
        note_dup(gym_ids, rec.get("id"), rel, "gym")
        if strict_paths and p.stem != rec.get("id"):
            errs.append(f"{rel}: filename stem != id '{rec.get('id')}'")

    # alias must not collide with a live slug
    for a, path in aliases.items():
        if a in slugs:
            errs.append(f"alias '{a}' ({path}) collides with live slug ({slugs[a]})")

    # asset key prefix + document url scheme (all record types)
    for p, rec in machines + gyms + sightings:
        rel = disp(p)
        for d in iter_dicts(rec):
            k = d.get("key")
            if isinstance(k, str) and not k.startswith(ASSET_PREFIX):
                errs.append(f"{rel}: asset key '{k}' missing '{ASSET_PREFIX}' prefix")
        for doc in documents(rec):
            if doc.get("tier") in ("link", "self-host"):
                url = doc.get("url", "")
                if not url.startswith("https://"):
                    errs.append(f"{rel}: document url must be https: '{url}'")

    # referential integrity: machine links
    for p, rec in machines:
        rel = disp(p)
        links = rec.get("links", {}) or {}
        for kind, lst in links.items():
            for tgt in lst or []:
                if tgt not in machine_ids:
                    errs.append(f"{rel}: links.{kind} -> unknown machine '{tgt}'")

    # referential integrity: sightings
    for p, rec in sightings:
        rel = disp(p)
        note_dup(sig_ids, rec.get("id"), rel, "sighting")
        mid = rec.get("machine_id")
        if mid not in machine_ids:
            errs.append(f"{rel}: machine_id -> unknown machine '{mid}'")
        if rec.get("place_id") not in gym_ids:
            errs.append(f"{rel}: place_id -> unknown gym '{rec.get('place_id')}'")
        gid = rec.get("generation_id")
        if gid is not None:
            if gid not in gen_ids:
                errs.append(f"{rel}: generation_id -> unknown generation '{gid}'")
            elif mid in machine_gens and gid not in machine_gens[mid]:
                errs.append(f"{rel}: generation_id '{gid}' does not belong to machine '{mid}'")
        if strict_paths and p.parent.name != mid:
            errs.append(f"{rel}: parent dir '{p.parent.name}' != machine_id '{mid}'")

    # id immutability vs a base ref
    if base_ref:
        for p, rec in machines + gyms:
            rel = disp(p)
            old = git_show(base_ref, str(rel))
            if old and old.get("id") != rec.get("id"):
                errs.append(f"{rel}: id changed from '{old.get('id')}' to '{rec.get('id')}' (ids are immutable)")

    return errs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fixtures", action="store_true",
                    help="check tests/fixtures/ (flat layout) instead of data/")
    ap.add_argument("--base-ref", default=None,
                    help="git ref to check id immutability against (e.g. origin/main)")
    args = ap.parse_args()

    if args.fixtures:
        base, strict = ROOT / "tests" / "fixtures", False
    else:
        base, strict = ROOT / "data", True

    errs = run(base, strict_paths=strict, base_ref=args.base_ref)
    if errs:
        print(f"{len(errs)} integrity error(s):")
        for e in errs:
            print(f"  - {e}")
        return 1
    print("integrity checks: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
