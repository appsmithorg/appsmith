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
import copy
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
NODE_PROPERTIES = re.compile(r"(?:[&!]\S*\s+)*")
HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")


def workflow_files(root):
    base = root / ".github"
    files = list((base / "workflows").glob("*.yml"))
    files += list((base / "workflows").glob("*.yaml"))
    files += list((base / "actions").glob("**/action.yml"))
    files += list((base / "actions").glob("**/action.yaml"))
    return sorted(set(files))


class AliasLoader(yaml.SafeLoader):
    """Compose YAML, keeping where each alias is used.

    PyYAML resolves ``*name`` to the anchored node itself, with the anchor's
    marks, so the place the alias is used is lost. Here each use gets its own
    shallow copy of that node, with ``alias_line`` set to the 1-based line of
    the ``*name``. The copy keeps the anchor's marks, which locate the text.
    """

    def compose_node(self, parent, index):
        if not self.check_event(yaml.AliasEvent):
            return super().compose_node(parent, index)
        line = self.peek_event().start_mark.line + 1
        alias = copy.copy(super().compose_node(parent, index))
        alias.alias_line = line
        return alias


def content_span(node, source):
    """Return the (start, end) indexes of a scalar's content in ``source``.

    The node's marks also cover its properties (``&anchor``, ``!tag``) and,
    for a block scalar, the header line with its indicator and any comment.
    None of that is part of the value.
    """
    start, end = NODE_PROPERTIES.match(source, node.start_mark.index).end(), node.end_mark.index
    if node.style in ("|", ">"):
        newline = source.find("\n", start, end)
        start = end if newline < 0 else newline + 1
    return start, end


def source_matches(node, source, pattern):
    """Yield (first_line, last_line, text) for each ``pattern`` match in a scalar node.

    Lines are 1-based and come from the file's own text, never from the parsed
    value. Parsing folds ``>`` blocks, multi-line plain and quoted scalars, and
    escapes, so offsets in ``node.value`` do not map back to source lines.
    """
    start, end = content_span(node, source)
    matches = list(pattern.finditer(source, start, end))
    for match in matches:
        first = source.count("\n", 0, match.start()) + 1
        yield first, first + match.group(0).count("\n"), match.group(0)
    parsed = [match.group(0) for match in pattern.finditer(node.value)]
    if len(parsed) > len(matches):
        # The parsed value holds a match the source text does not spell out,
        # for example through a YAML escape. Fail closed: report the whole node.
        first, last = source.count("\n", 0, start) + 1, source.count("\n", 0, end) + 1
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
    """Return a sorted list of (first_line, last_line, alias_lines, rule, snippet) for one file.

    ``alias_lines`` holds the line of each alias that brings the match to where
    it is. A change to any of them, or to the match's own lines, makes the
    match new.
    """
    source = Path(path).read_text(encoding="utf-8")
    root = yaml.compose(source, Loader=AliasLoader)
    found = set()

    def scan(node, pattern, rule, via):
        for first, last, text in source_matches(node, source, pattern):
            found.add((first, last, via, rule, text))

    def walk(node, via, path):
        if id(node) in path:
            return  # A recursive alias. GitHub rejects it; do not loop on it.
        path = path | {id(node)}
        if hasattr(node, "alias_line"):
            via = via | {node.alias_line}
        if isinstance(node, yaml.MappingNode):
            run = mapping_get(node, "run")
            if isinstance(run, yaml.ScalarNode):
                scan(run, EXPRESSION, "run", via | alias_lines(run))
            if is_github_script(node):
                with_node = mapping_get(node, "with")
                script = mapping_get(with_node, "script") if isinstance(with_node, yaml.MappingNode) else None
                if isinstance(script, yaml.ScalarNode):
                    scan(script, EXPRESSION, "script", via | alias_lines(with_node) | alias_lines(script))
            for key, value in node.value:
                walk(key, via, path)
                walk(value, via, path)
        elif isinstance(node, yaml.SequenceNode):
            for value in node.value:
                walk(value, via, path)
        elif isinstance(node, yaml.ScalarNode):
            scan(node, WHOLE_CONTEXT, "whole-context", via)

    if root is not None:
        walk(root, frozenset(), frozenset())
    return sorted(found, key=lambda item: (item[0], item[1], sorted(item[2]), item[3], item[4]))


def alias_lines(node):
    return frozenset({node.alias_line}) if hasattr(node, "alias_line") else frozenset()


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
        for line, last, aliases, rule, snippet in find_violations(path):
            if rule == "whole-context":
                message = (
                    f"{rel}:{line}: {snippet} passes the whole context, which can exceed the 131,072-byte "
                    "limit for one environment string. Read single fields, or the file at $GITHUB_EVENT_PATH."
                )
            elif changed is None or (set(range(line, last + 1)) | aliases) & changed.get(rel, set()):
                message = (
                    f"{rel}:{line}: {snippet} is inside a {rule}: body. "
                    "Pass the value through env: and read the quoted variable."
                )
                for alias in sorted(aliases):
                    message += f" It reaches the script through the alias on line {alias}."
            else:
                continue
            if message not in errors:
                errors.append(message)
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
