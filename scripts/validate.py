#!/usr/bin/env python3
"""Validate Iron Archive YAML records against the JSON Schemas.

Validates every data/machines/*.yml (real records) and tests/fixtures/*.yml
(examples) against data/schema/machine.schema.json.

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
SCHEMA = ROOT / "data" / "schema" / "machine.schema.json"
TARGETS = [ROOT / "data" / "machines", ROOT / "tests" / "fixtures"]


def coerce_dates(obj):
    if isinstance(obj, dict):
        return {k: coerce_dates(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [coerce_dates(v) for v in obj]
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    return obj


def main() -> int:
    schema = json.loads(SCHEMA.read_text())
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())

    files = sorted(p for d in TARGETS if d.exists() for p in d.glob("*.yml"))
    if not files:
        print("no records to validate yet")
        return 0

    total_errors = 0
    for f in files:
        record = coerce_dates(yaml.safe_load(f.read_text()))
        errs = sorted(validator.iter_errors(record), key=lambda e: list(e.path))
        rel = f.relative_to(ROOT)
        if errs:
            total_errors += len(errs)
            print(f"FAIL {rel} ({len(errs)} error(s))")
            for e in errs:
                loc = "/".join(str(p) for p in e.path) or "(root)"
                print(f"  - {loc}: {e.message}")
        else:
            print(f"ok   {rel}")

    print(f"\n{len(files)} file(s), {total_errors} error(s)")
    return 1 if total_errors else 0


if __name__ == "__main__":
    sys.exit(main())
