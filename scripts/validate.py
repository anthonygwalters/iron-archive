#!/usr/bin/env python3
"""Validate Iron Archive YAML records against their JSON Schemas.

Routes each record type to the right schema:
  data/machines/*.yml          -> machine.schema.json
  data/gyms/*.yml              -> gym.schema.json
  data/sightings/**/*.yml      -> sighting.schema.json
and the parallel tests/fixtures/{machines,gyms,sightings}/*.yml examples.

Deps: pip install jsonschema pyyaml rfc3339-validator
Usage: python scripts/validate.py   (exit 0 = all valid, 1 = errors)

Note: YAML parses an unquoted 2026-09-01 into a date OBJECT, not a string, so we
defensively coerce dates/datetimes to ISO strings before validating. The intake
pipeline must do the same (or always emit quoted dates).
"""
import datetime
import json
import pathlib
import sys

import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHEMA_DIR = ROOT / "data" / "schema"

SCHEMAS = {
    "machine": SCHEMA_DIR / "machine.schema.json",
    "gym": SCHEMA_DIR / "gym.schema.json",
    "sighting": SCHEMA_DIR / "sighting.schema.json",
}

# (glob relative to ROOT, schema key). ** matches nested dirs.
TARGETS = [
    ("data/machines/*.yml", "machine"),
    ("data/gyms/*.yml", "gym"),
    ("data/sightings/**/*.yml", "sighting"),
    ("tests/fixtures/machines/*.yml", "machine"),
    ("tests/fixtures/gyms/*.yml", "gym"),
    ("tests/fixtures/sightings/*.yml", "sighting"),
]


def coerce_dates(obj):
    if isinstance(obj, dict):
        return {k: coerce_dates(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [coerce_dates(v) for v in obj]
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    return obj


def main() -> int:
    validators = {}
    for key, path in SCHEMAS.items():
        schema = json.loads(path.read_text())
        Draft202012Validator.check_schema(schema)
        validators[key] = Draft202012Validator(schema, format_checker=FormatChecker())

    total_errors = 0
    total_files = 0
    for glob, key in TARGETS:
        for f in sorted(ROOT.glob(glob)):
            total_files += 1
            record = coerce_dates(yaml.safe_load(f.read_text()))
            errs = sorted(validators[key].iter_errors(record), key=lambda e: list(e.path))
            rel = f.relative_to(ROOT)
            if errs:
                total_errors += len(errs)
                print(f"FAIL [{key}] {rel} ({len(errs)} error(s))")
                for e in errs:
                    loc = "/".join(str(p) for p in e.path) or "(root)"
                    print(f"  - {loc}: {e.message}")
            else:
                print(f"ok   [{key}] {rel}")

    if total_files == 0:
        print("no records to validate yet")
        return 0
    print(f"\n{total_files} file(s), {total_errors} error(s)")
    return 1 if total_errors else 0


if __name__ == "__main__":
    sys.exit(main())
