# Cursor Rules

This directory contains configuration for cursor-specific rules and behaviors.

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
