#!/usr/bin/env python3
"""Check GitHub Actions workflows for two expression patterns that break CI.

1. An expression (``${{ ... }}``) inside a ``run:`` body, or inside the
   ``script:`` input of ``actions/github-script``. The runner pastes the value
   into the script before the shell or Node reads it, so text such as a commit
   message runs as code. Pass the value through ``env:`` and read the quoted
   variable instead.

2. ``toJSON(github)`` or ``toJSON(github.event)``. The whole context holds every
   commit message of a push. In an environment variable or argument it can pass
   the Linux limit of 131,072 bytes for one string, and the step then fails with
   "Argument list too long". Read single fields, or the event file at
   ``$GITHUB_EVENT_PATH``.

Rule 2 applies to every file. Many workflows still break rule 1, so with
``--base`` it applies only to lines changed since that revision: new code must
follow it, and old code is fixed when someone edits it. Without ``--base``,
rule 1 applies to every line.

Usage:
  check-workflow-expressions.py [--root DIR] [--base REV]
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # Fail closed: a missing parser must not pass the check.
    print("error: PyYAML is required (python3 -m pip install pyyaml)", file=sys.stderr)
    sys.exit(2)

EXPRESSION = re.compile(r"\$\{\{.*?\}\}", re.DOTALL)
WHOLE_CONTEXT = re.compile(r"toJSON\(\s*github(\.event)?\s*\)", re.IGNORECASE)
HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")


def workflow_files(root):
    base = root / ".github"
    files = list((base / "workflows").glob("*.yml"))
    files += list((base / "workflows").glob("*.yaml"))
    files += list((base / "actions").glob("**/action.yml"))
    files += list((base / "actions").glob("**/action.yaml"))
    return sorted(set(files))


def scalar_line(node, text, offset):
    """Return the 1-based file line of ``text[offset]`` inside a scalar node."""
    first = node.start_mark.line + 1
    if node.style in ("|", ">"):
        first += 1  # A block scalar's content starts on the line after the indicator.
    return first + text.count("\n", 0, offset)


def mapping_get(node, key):
    for key_node, value_node in node.value:
        if isinstance(key_node, yaml.ScalarNode) and key_node.value == key:
            return value_node
    return None


def is_github_script(step_node):
    uses = mapping_get(step_node, "uses")
    return isinstance(uses, yaml.ScalarNode) and uses.value.startswith("actions/github-script@")


def find_violations(path):
    """Return a sorted list of (line, rule, snippet) for one workflow or action file."""
    with open(path, encoding="utf-8") as handle:
        root = yaml.compose(handle)
    found = []

    def scan_script(node, rule):
        for match in EXPRESSION.finditer(node.value):
            found.append((scalar_line(node, node.value, match.start()), rule, match.group(0)))

    def walk(node):
        if isinstance(node, yaml.MappingNode):
            run = mapping_get(node, "run")
            if isinstance(run, yaml.ScalarNode):
                scan_script(run, "run")
            if is_github_script(node):
                with_node = mapping_get(node, "with")
                script = mapping_get(with_node, "script") if isinstance(with_node, yaml.MappingNode) else None
                if isinstance(script, yaml.ScalarNode):
                    scan_script(script, "script")
            for _, value in node.value:
                walk(value)
        elif isinstance(node, yaml.SequenceNode):
            for value in node.value:
                walk(value)
        elif isinstance(node, yaml.ScalarNode):
            for match in WHOLE_CONTEXT.finditer(node.value):
                found.append((scalar_line(node, node.value, match.start()), "whole-context", match.group(0)))

    if root is not None:
        walk(root)
    return sorted(found)


def added_lines(root, base):
    """Map each file under .github changed since ``base`` to its added line numbers."""
    diff = subprocess.run(
        ["git", "-C", str(root), "diff", "--no-color", "--no-ext-diff", "-U0", base, "--", ".github"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    added, current = {}, None
    for line in diff.splitlines():
        if line.startswith("+++ "):
            current = line[6:] if line.startswith("+++ b/") else None
            if current is not None:
                added.setdefault(current, set())
        elif current is not None:
            hunk = HUNK.match(line)
            if hunk:
                start, length = int(hunk.group(1)), int(hunk.group(2) or "1")
                added[current].update(range(start, start + length))
    return added


def check(root, base=None):
    """Return the list of error messages for the workflows under ``root``."""
    changed = added_lines(root, base) if base else None
    errors = []
    for path in workflow_files(root):
        rel = path.relative_to(root).as_posix()
        for line, rule, snippet in find_violations(path):
            if rule == "whole-context":
                errors.append(
                    f"{rel}:{line}: {snippet} passes the whole context, which can exceed the 131,072-byte "
                    "limit for one environment string. Read single fields, or the file at $GITHUB_EVENT_PATH."
                )
            elif changed is None or line in changed.get(rel, ()):
                errors.append(
                    f"{rel}:{line}: {snippet} is inside a {rule}: body. "
                    "Pass the value through env: and read the quoted variable."
                )
    return errors


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--root", default=".", help="repository root (default: current directory)")
    parser.add_argument("--base", default=None, help="check rule 1 only on lines added since this git revision")
    args = parser.parse_args(argv)

    errors = check(Path(args.root).resolve(), args.base)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    scope = f"lines changed since {args.base}" if args.base else "all lines"
    print(f"OK: no workflow expression problems ({scope}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
