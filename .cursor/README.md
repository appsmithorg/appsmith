# Appsmith Cursor Configuration

This directory contains configuration for Cursor AI tools, rules, and guidelines for the Appsmith project.

## Directory Structure

```
.cursor/
├── settings.json                  # Main configuration file
├── docs/                          # Documentation
│   ├── guides/                    # In-depth guides
│   ├── references/                # Quick references
│   └── practices/                 # Best practices
├── rules/                         # Rule definitions
│   ├── commit/                    # Commit-related rules
│   ├── quality/                   # Code quality rules
│   ├── testing/                   # Testing rules
│   └── verification/              # Verification rules
└── hooks/                         # Git hooks and scripts
```

## Key Features

- **Commit Message Rules**: Guidelines for structured, informative commit messages
- **Code Quality Checks**: Automated validation of code quality standards
- **Testing Requirements**: Rules for test coverage and quality
- **Performance Guidelines**: Best practices for maintaining high performance
- **Documentation**: Comprehensive guides and references for the codebase

## Usage

- Use the rules in this directory to ensure consistent quality across the project
- Reference the documentation for best practices and technical details
- Hooks automate common tasks and enforce quality standards

For more information, see the specific README files in each subdirectory.

## Commit Message Rules

- Messages must be concise and single-line
- Must start with a verb (e.g., adds, removes, updates)
- For significant changes:

  ```
  Heading

  Detailed description
  ```

## Workspace Rules

### Derived Files

- Use `/*** */` for comments instead of `//`

### Cypress Tests

- Run command: `yarn cypress run --browser chrome --headless --spec {fileName}`
- Execute from: `app/client` directory
- File paths should be relative to `app/client`
