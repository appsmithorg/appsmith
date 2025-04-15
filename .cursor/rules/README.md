# Appsmith Cursor Rules

This directory contains the rules that Cursor AI uses to validate and improve code quality in the Appsmith project.

## Rule Categories

- **commit/**: Rules for validating commit messages and pull requests
  - `semantic-pr.md`: Guidelines for semantic pull request titles

- **quality/**: Rules for ensuring code quality
  - `performance.mdc`: Rules for optimizing performance
  - `pre-commit-checks.mdc`: Quality checks that run before commits

- **testing/**: Rules for test coverage and quality
  - `test-generator.mdc`: Automated test generation based on code changes

- **verification/**: Rules for verifying changes and implementations
  - `bug-fix-verifier.mdc`: Validation for bug fix implementations
  - `feature-verifier.mdc`: Validation for feature implementations
  - `workflow-validator.mdc`: Validation for development workflows

## How Rules Work

Each rule is defined in a Markdown Cursor (`.mdc`) file that includes:

1. **Metadata**: Name, description, and trigger conditions
2. **Logic**: JavaScript code that implements the rule
3. **Documentation**: Usage examples and explanations

Rules are automatically triggered based on events like:
- Creating or updating pull requests
- Modifying files
- Running specific commands in Cursor

## Using Rules

You can manually trigger rules using Cursor commands, such as:
- `validate_pr_title`: Check if a PR title follows conventions
- `verify_bug_fix`: Validate a bug fix implementation
- `generate_tests`: Generate tests for changed code
- `optimize_performance`: Analyze code for performance issues

Refer to each rule's documentation for specific usage information. 