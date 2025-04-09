# Appsmith Cursor Rules

This index provides an overview of all the rules available for Cursor AI in the Appsmith project.

## Commit Rules

- [Semantic PR Validator](commit/semantic-pr-validator.mdc): Validates that PR titles follow the Conventional Commits specification
- [Semantic PR Guidelines](commit/semantic-pr.md): Guidelines for writing semantic PR titles and commit messages

## Quality Rules

- [Performance Optimizer](quality/performance-optimizer.mdc): Analyzes code for performance issues and suggests improvements
- [Pre-commit Quality Checks](quality/pre-commit-checks.mdc): Checks code quality before commits

## Testing Rules

- [Test Generator](testing/test-generator.mdc): Automatically generates appropriate tests for code changes

## Verification Rules

- [Bug Fix Verifier](verification/bug-fix-verifier.mdc): Guides developers through proper bug fixing steps and verifies fix quality
- [Feature Verifier](verification/feature-verifier.mdc): Verifies that new features are properly implemented and tested
- [Feature Implementation Validator](verification/feature-implementation-validator.mdc): Validates that new features are completely and correctly implemented
- [Workflow Validator](verification/workflow-validator.mdc): Validates development workflows

## Available Commands

| Command | Description | Rule |
|---------|-------------|------|
| `validate_pr_title` | Validates PR title format | Semantic PR Validator |
| `verify_bug_fix` | Verifies bug fix quality | Bug Fix Verifier |
| `validate_feature` | Validates feature implementation | Feature Implementation Validator |
| `verify_feature` | Verifies feature implementation quality | Feature Verifier |
| `generate_tests` | Generates tests for code changes | Test Generator |
| `optimize_performance` | Analyzes code for performance issues | Performance Optimizer |
| `update_docs` | Updates documentation based on code changes | Auto Update Docs |

## Triggering Rules

Rules can be triggered:
1. Automatically based on events (PR creation, file modification, etc.)
2. Manually via commands in Cursor
3. From CI/CD pipelines

See each rule's documentation for specific trigger conditions and parameters. 