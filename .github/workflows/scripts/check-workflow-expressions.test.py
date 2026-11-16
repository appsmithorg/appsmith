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
        run: printf '%s\\n' "$COMMIT_MESSAGE" | head -n 1
"""


class CheckWorkflowExpressionsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / ".github" / "workflows").mkdir(parents=True)

    def tearDown(self):
        self.tmp.cleanup()

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
