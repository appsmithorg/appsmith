# Appsmith Cursor Hooks

This directory contains hooks and scripts that automate tasks and enforce standards in the Appsmith development workflow.

## Available Hooks

### scripts/update-docs.sh
Automatically updates documentation based on code changes, ensuring that the documentation stays in sync with the codebase.

## How Hooks Work

Hooks are triggered by specific events in the development workflow, such as:
- Creating a pull request
- Pushing code to a branch
- Running specific commands

Each hook performs specific actions to maintain code quality, enforce standards, or automate routine tasks.

## Installing Hooks

To install these hooks in your local development environment:

1. Navigate to the root of the project
2. Run the following command:
   ```bash
   cp .cursor/hooks/scripts/* .git/hooks/
   chmod +x .git/hooks/*
   ```

This will copy the hooks to your local Git hooks directory and make them executable.

## Manual Execution

You can also run these hooks manually as needed:

```bash
# Update documentation based on code changes
.cursor/hooks/scripts/update-docs.sh
```

## Customizing Hooks

If you need to customize a hook for your specific development environment, copy it to your local `.git/hooks` directory and modify it as needed. Avoid changing the hooks in this directory directly, as they will be overwritten when you pull changes from the repository. 