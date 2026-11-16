"""Tests for check-workflow-expressions.py. Run: python3 .github/workflows/scripts/check-workflow-expressions.test.py"""

import importlib.util
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("check-workflow-expressions.py")
spec = importlib.util.spec_from_file_location("check_workflow_expressions", SCRIPT)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)

# The two steps that failed the 2026-11-16 master promotion, as they were.
SLACK_STEP = """\
name: Test
on: push
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Generate slack message
        env:
          EVENT_COMMITS: ${{ toJson(github.event.commits[0].message) }}
        run: |
          eventCommit=$(echo ${{env.EVENT_COMMITS}} | sed "s/'//g")
"""

CONTEXT_DUMP = """\
name: Test
on: push
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Dump GitHub context
        env:
          GITHUB_CONTEXT: ${{ toJSON(github) }}
        run: echo "$GITHUB_CONTEXT"
"""

SAFE = """\
name: Test
on: push
jobs:
  report:
    runs-on: ubuntu-latest
    if: ${{ github.ref == 'refs/heads/release' }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.sha }}
      - name: Use env
        env:
          COMMIT_MESSAGE: ${{ github.event.commits[0].message }}
        run: echo "${COMMIT_MESSAGE%%$'\\n'*}"
"""

# A run: body whose style is filled in per test. Its content starts on line 8.
FOLD_STEP = """\
name: Test
on: push
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - run: {style}
"""

# Old anchors, ready to be aliased on line 10. The step anchor's own run: is old too.
ALIAS_SCALAR = """\
name: Test
on: push
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Old step
        env:
          CMD: &cmd 'echo "${{ github.event.pull_request.title }}"'
"""

ALIAS_STEP = """\
name: Test
on: push
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - &step
        run: echo "${{ github.event.pull_request.title }}"
      - run: echo two
"""

ACTION = """\
name: Action
runs:
  using: composite
  steps:
    - shell: bash
      run: echo "${{ inputs.title }}"
"""


class CheckWorkflowExpressionsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / ".github" / "workflows").mkdir(parents=True)

    def tearDown(self):
        self.tmp.cleanup()

    def reset(self):
        self.tearDown()
        self.setUp()

    def write(self, name, content):
        (self.root / ".github" / "workflows" / name).write_text(textwrap.dedent(content))

    def git(self, *args):
        subprocess.run(["git", "-C", str(self.root), *args], check=True, capture_output=True)

    def commit_all(self):
        self.git("add", "-A")
        self.git("-c", "user.name=t", "-c", "user.email=t@example.com", "commit", "-q", "-m", "c")

    def test_should_flagExpressionInRunBody_when_commitMessageIsInterpolated(self):
        # Given
        self.write("w.yml", SLACK_STEP)

        # When
        errors = checker.check(self.root)

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn(".github/workflows/w.yml:11: ${{env.EVENT_COMMITS}} is inside a run: body", errors[0])

    def test_should_flagWholeContext_when_toJsonGithubIsPassedToEnv(self):
        # Given
        self.write("w.yml", CONTEXT_DUMP)

        # When
        errors = checker.check(self.root)

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn(".github/workflows/w.yml:9: toJSON(github) passes the whole context", errors[0])

    def test_should_flagWholeEventContext_when_toJsonGithubEventIsUsed(self):
        # Given
        self.write("w.yml", CONTEXT_DUMP.replace("toJSON(github)", "toJson( github.event )"))

        # When
        errors = checker.check(self.root)

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn("toJson( github.event ) passes the whole context", errors[0])

    def test_should_flagExpressionInGithubScript_when_scriptInterpolatesInput(self):
        # Given
        self.write(
            "w.yml",
            """\
            name: Test
            on: push
            jobs:
              report:
                runs-on: ubuntu-latest
                steps:
                  - uses: actions/github-script@v7
                    with:
                      script: |
                        const title = "${{ github.event.pull_request.title }}";
            """,
        )

        # When
        errors = checker.check(self.root)

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn("w.yml:10: ${{ github.event.pull_request.title }} is inside a script: body", errors[0])

    def test_should_passExpressions_when_theyAreInEnvIfAndWith(self):
        # Given
        self.write("w.yml", SAFE)

        # When
        errors = checker.check(self.root)

        # Then
        self.assertEqual(errors, [])

    def test_should_ignoreOldExpression_when_lineIsUnchangedSinceBase(self):
        # Given
        self.git("init", "-q")
        self.write("w.yml", SLACK_STEP)
        self.commit_all()
        self.write("w.yml", SLACK_STEP + "          echo done\n")

        # When
        errors = checker.check(self.root, base="HEAD")

        # Then
        self.assertEqual(errors, [])

    def test_should_flagNewExpression_when_lineIsAddedSinceBase(self):
        # Given
        self.git("init", "-q")
        self.write("w.yml", SLACK_STEP)
        self.commit_all()
        self.write("w.yml", SLACK_STEP + "          echo ${{ github.event.head_commit.message }}\n")

        # When
        errors = checker.check(self.root, base="HEAD")

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn("w.yml:12: ${{ github.event.head_commit.message }} is inside a run: body", errors[0])

    def test_should_flagAddedLine_when_scalarIsFoldedOrMultiLine(self):
        # Folding joins lines in the parsed value, so a line taken from it points
        # at the unchanged first line. Each case adds only the second content line.
        for style in (">", ">-", ""):
            with self.subTest(style=style or "plain"):
                self.reset()
                self.git("init", "-q")
                head = FOLD_STEP.format(style=style)
                self.write("w.yml", head + "          echo start\n")
                self.commit_all()
                self.write("w.yml", head + "          echo start\n          ${{ github.event.pull_request.title }}\n")

                errors = checker.check(self.root, base="HEAD")

                self.assertEqual(len(errors), 1, errors)
                self.assertIn("w.yml:9: ${{ github.event.pull_request.title }} is inside a run: body", errors[0])

    def test_should_flagExpression_when_onlyItsSecondLineIsAdded(self):
        # Given
        self.git("init", "-q")
        self.write("w.yml", FOLD_STEP.format(style="|") + "          echo ${{ github.event\n")
        self.commit_all()
        self.write(
            "w.yml",
            FOLD_STEP.format(style="|") + "          echo ${{ github.event\n            .pull_request.title }}\n",
        )

        # When
        errors = checker.check(self.root, base="HEAD")

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn("w.yml:8: ${{ github.event\n", errors[0])

    def test_should_flagExpression_when_yamlEscapeSpellsIt(self):
        # Given
        self.write(
            "w.yml", FOLD_STEP.format(style="") + '          "echo \\x24{{ github.event.pull_request.title }}"\n'
        )

        # When
        errors = checker.check(self.root)

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn("w.yml:8: ${{ github.event.pull_request.title }} is inside a run: body", errors[0])

    def test_should_flagAddedLines_when_actionPathNeedsGitQuoting(self):
        # Git quotes non-ASCII and special names in diff headers; the glob
        # characters would also act as a pathspec if passed unescaped.
        for name in ("café", "a b", "x*[y]"):
            with self.subTest(name=name):
                self.reset()
                self.git("init", "-q")
                self.write("w.yml", SAFE)
                self.commit_all()
                action = self.root / ".github" / "actions" / name / "action.yml"
                action.parent.mkdir(parents=True)
                action.write_text(ACTION)
                self.git("add", "-A")

                errors = checker.check(self.root, base="HEAD")

                self.assertEqual(len(errors), 1, errors)
                self.assertIn(f".github/actions/{name}/action.yml:6: ${{{{ inputs.title }}}}", errors[0])

    def test_should_flagAllLines_when_fileIsUntracked(self):
        # Given
        self.git("init", "-q")
        self.write("w.yml", SAFE)
        self.commit_all()
        self.write("new.yml", SLACK_STEP)

        # When
        errors = checker.check(self.root, base="HEAD")

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn("new.yml:11: ${{env.EVENT_COMMITS}} is inside a run: body", errors[0])

    def test_should_ignoreExpression_when_itIsInBlockHeaderComment(self):
        # Given
        self.write(
            "w.yml", FOLD_STEP.format(style="| # never ${{ github.event.pull_request.title }}") + "          echo ok\n"
        )

        # When
        errors = checker.check(self.root)

        # Then
        self.assertEqual(errors, [])

    def test_should_scanContentOnly_when_scalarHasAnchorAndTag(self):
        # Given
        self.write("w.yml", FOLD_STEP.format(style="&cmd !!str |") + "          echo ${{ github.head_ref }}\n")

        # When
        errors = checker.check(self.root)

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn("w.yml:8: ${{ github.head_ref }} is inside a run: body", errors[0])

    def test_should_flagAliasUse_when_onlyTheAliasLineIsAdded(self):
        # The anchored text is old (for the scalar, it sits in env:, where it is
        # safe). Only the new alias on line 10 puts it into a new run: body.
        for kind, before, after in (
            ("scalar", ALIAS_SCALAR, ALIAS_SCALAR + "        run: *cmd\n"),
            ("step", ALIAS_STEP, ALIAS_STEP + "      - *step\n"),
        ):
            with self.subTest(kind=kind):
                self.reset()
                self.git("init", "-q")
                self.write("w.yml", before)
                self.commit_all()
                self.write("w.yml", after)

                errors = checker.check(self.root, base="HEAD")

                self.assertEqual(len(errors), 1, errors)
                self.assertIn("${{ github.event.pull_request.title }} is inside a run: body", errors[0])
                self.assertIn("through the alias on line 10.", errors[0])

    def test_should_ignoreAlias_when_neitherAliasNorAnchorChanged(self):
        # Given
        self.git("init", "-q")
        self.write("w.yml", ALIAS_SCALAR + "        run: *cmd\n")
        self.commit_all()
        self.write("w.yml", ALIAS_SCALAR + "        run: *cmd\n      - run: echo done\n")

        # When
        errors = checker.check(self.root, base="HEAD")

        # Then
        self.assertEqual(errors, [])

    def test_should_flagWholeContext_when_lineIsUnchangedSinceBase(self):
        # Given
        self.git("init", "-q")
        self.write("w.yml", CONTEXT_DUMP)
        self.commit_all()

        # When
        errors = checker.check(self.root, base="HEAD")

        # Then
        self.assertEqual(len(errors), 1)
        self.assertIn("toJSON(github) passes the whole context", errors[0])


if __name__ == "__main__":
    unittest.main()
