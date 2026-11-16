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
follow it, and old code is fixed when someone edits it. A new, renamed or
untracked file counts as added in full. Without ``--base``, rule 1 applies to
every line. With ``--base``, ``--root`` must be the top of the git work tree.

Line numbers come from the file's text, not from the parsed YAML values, so
they are right for folded (``>``), plain and quoted multi-line scalars too.

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


def source_matches(node, source, pattern):
    """Yield (first_line, last_line, text) for each ``pattern`` match in a scalar node.

    Lines are 1-based and come from the file's own text, never from the parsed
    value. Parsing folds ``>`` blocks, multi-line plain and quoted scalars, and
    escapes, so offsets in ``node.value`` do not map back to source lines.
    """
    start, end = node.start_mark.index, node.end_mark.index
    matches = list(pattern.finditer(source, start, end))
    for match in matches:
        first = source.count("\n", 0, match.start()) + 1
        yield first, first + match.group(0).count("\n"), match.group(0)
    parsed = [match.group(0) for match in pattern.finditer(node.value)]
    if len(parsed) > len(matches):
        # The parsed value holds a match the source text does not spell out,
        # for example through a YAML escape. Fail closed: report the whole node.
        first, last = node.start_mark.line + 1, source.count("\n", 0, end) + 1
        yield first, last, parsed[0]


def mapping_get(node, key):
    for key_node, value_node in node.value:
        if isinstance(key_node, yaml.ScalarNode) and key_node.value == key:
            return value_node
    return None


def is_github_script(step_node):
    uses = mapping_get(step_node, "uses")
    return isinstance(uses, yaml.ScalarNode) and uses.value.startswith("actions/github-script@")


def find_violations(path):
    """Return a sorted list of (first_line, last_line, rule, snippet) for one workflow or action file."""
    source = Path(path).read_text(encoding="utf-8")
    root = yaml.compose(source)
    found = []

    def scan(node, pattern, rule):
        for first, last, text in source_matches(node, source, pattern):
            found.append((first, last, rule, text))

    def walk(node):
        if isinstance(node, yaml.MappingNode):
            run = mapping_get(node, "run")
            if isinstance(run, yaml.ScalarNode):
                scan(run, EXPRESSION, "run")
            if is_github_script(node):
                with_node = mapping_get(node, "with")
                script = mapping_get(with_node, "script") if isinstance(with_node, yaml.MappingNode) else None
                if isinstance(script, yaml.ScalarNode):
                    scan(script, EXPRESSION, "script")
            for _, value in node.value:
                walk(value)
        elif isinstance(node, yaml.SequenceNode):
            for value in node.value:
                walk(value)
        elif isinstance(node, yaml.ScalarNode):
            scan(node, WHOLE_CONTEXT, "whole-context")

    if root is not None:
        walk(root)
    return sorted(found)


def git(root, *args):
    return subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True).stdout


def added_lines(root, base, files):
    """Map each file in ``files`` ({path relative to ``root``: Path}) to the lines added since ``base``.

    ``root`` must be the top of the git work tree. Paths come from ``files``
    and from NUL-delimited git output, never from diff headers, which git quotes
    and escapes for unusual names. A renamed file, or one git does not track
    yet, counts as added in full.
    """
    untracked = set(git(root, "ls-files", "-z", "--others", "--exclude-standard", "--", ".github").decode().split("\0"))
    changed = set(git(root, "diff", "-z", "--name-only", "--no-renames", base, "--", ".github").decode().split("\0"))
    added = {}
    for rel, path in files.items():
        if rel in untracked:
            added[rel] = set(range(1, path.read_text(encoding="utf-8").count("\n") + 2))
        elif rel in changed:
            diff = git(
                root, "diff", "--no-color", "--no-ext-diff", "--no-renames", "-U0", base, "--", f":(literal){rel}"
            )
            lines = set()
            for line in diff.decode("utf-8", "replace").splitlines():
                hunk = HUNK.match(line)
                if hunk:
                    start, length = int(hunk.group(1)), int(hunk.group(2) or "1")
                    lines.update(range(start, start + length))
            added[rel] = lines
    return added


def check(root, base=None):
    """Return the list of error messages for the workflows under ``root``."""
    files = {path.relative_to(root).as_posix(): path for path in workflow_files(root)}
    changed = added_lines(root, base, files) if base else None
    errors = []
    for rel, path in files.items():
        for line, last, rule, snippet in find_violations(path):
            if rule == "whole-context":
                errors.append(
                    f"{rel}:{line}: {snippet} passes the whole context, which can exceed the 131,072-byte "
                    "limit for one environment string. Read single fields, or the file at $GITHUB_EVENT_PATH."
                )
            elif changed is None or any(n in changed.get(rel, ()) for n in range(line, last + 1)):
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
