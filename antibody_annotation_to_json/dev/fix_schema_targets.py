# Why this script is needed:
#   The JSON schema test suite files (https://github.com/sourcemeta/jsonschema/blob/main/docs/test.markdown)
#   contain a "target" property for the URI of the schema to be tested. In the case of unit tests for patternProperties,
#   the sub-schema name contains regex characters that are not allowed in URI strings.
#   From RFC 3986, most regex characters are either unreserved or allowed within URI fragments
#   The problematic characters (which cause URI parsing errors when present) are:
#   "|", "^", "[", "]"

# This script reads in the "target" strings from schema test JSON files and converts these characters to their
# percent-encoded hexadecimal form (%XX)

import argparse
import json
from pathlib import Path
from antibody_annotation_to_json.dev.uri import fix_uri


def iter_json_files(paths: list[Path]) -> list[Path]:
    out: list[Path] = []
    for p in paths:
        if p.is_dir():
            out.extend(sorted(p.rglob("*.json")))
        elif p.is_file() and p.suffix.lower() == ".json":
            out.append(p)
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Percent-encode URI-disallowed characters in Sourcemeta JSON Schema test 'target' fields."
    )
    ap.add_argument(
        "paths",
        nargs="+",
        type=Path,
        help="One or more JSON file(s) and/or directories (directories are scanned for *.json)",
    )
    ap.add_argument(
        "--indent",
        type=int,
        # Warning: only change the default to match the pre-commit hook for json formatting, if that changes
        default=2,
        help="Indent level when rewriting JSON (default: 2)",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would change and exit non-zero but do not write files",
    )
    args = ap.parse_args(argv)

    files = iter_json_files(args.paths)

    changed_files = 0
    out_msg = ""

    for fp in files:
        try:
            text = fp.read_text(encoding="utf-8")
            old_data = json.loads(text)
        except json.decoder.JSONDecodeError:
            # Quietly skip non-JSON files
            continue
        # This check is needed since json.loads() does not necessarily return a dict
        if not isinstance(old_data, dict):
            # Quietly skip
            continue
        old_target = old_data.get("target")
        if not isinstance(old_target, str):
            # Quietly skip files with no "target" property (get method returns None) or a non-string "target"
            continue

        new_target = fix_uri(old_target)
        if new_target != old_target:
            changed_files += 1
            out_msg += f"{fp}:\n  old target URI: {old_target}\n  new target URI: {new_target}\n"
            if args.dry_run:
                # Move on to the next file without re-writing the current one
                continue
            new_data = old_data
            new_data["target"] = new_target
            fp.write_text(
                json.dumps(new_data, indent=args.indent, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )

    if args.dry_run:
        out_msg = f"Would change {changed_files} file(s):\n" + out_msg
        print(out_msg)
        if changed_files > 0:
            # Exits non-zero: useful for pre-commit hooks
            return 1
    else:
        out_msg = f"Changed {changed_files} file(s):\n" + out_msg
        print(out_msg)

    # Exit code is 0 if a dry run would make no changes
    # With normal execution in a pre-commit hook, the commit is blocked depending on whether files were changed,
    # rather than the exit status
    return 0


if __name__ == "__main__":
    # Exit the program with the exit status of main()
    raise SystemExit(main())
