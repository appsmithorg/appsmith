# Semantic PR Guidelines for Appsmith

This guide outlines how to ensure your pull requests follow the Conventional Commits specification, which is enforced in this project using the [semantic-prs](https://github.com/Ezard/semantic-prs) GitHub app.

## Current Configuration

The project uses the following semantic PR configuration in `.github/semantic.yml`:

```yaml
# Always validate the PR title, and ignore the commits
titleOnly: true
```

This means that only the PR title needs to follow the Conventional Commits spec, and commit messages are not validated.

## Pull Request Title Format

PR titles should follow this format:

```
type(scope): description
```

### Types

Common types according to Conventional Commits:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect the code's meaning (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `build`: Changes to build process, dependencies, etc.
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify source or test files
- `revert`: Reverts a previous commit

### Scope

The scope is optional and represents the section of the codebase affected by the change (e.g., `client`, `server`, `widgets`, `plugins`).

### Description

A brief description of the changes. Should:
- Use imperative, present tense (e.g., "add" not "added" or "adds")
- Not capitalize the first letter
- Not end with a period

## Examples of Valid PR Titles

- `feat(widgets): add new table widget capabilities`
- `fix(auth): resolve login redirect issue`
- `docs: update README with new setup instructions`
- `refactor(api): simplify error handling logic`
- `chore: update dependencies to latest versions`

## Examples of Invalid PR Titles

- `Added new feature` (missing type)
- `fix - login bug` (improper format, missing scope)
- `feat(client): Added new component.` (description should use imperative mood and not end with period)

## Automated Validation

The semantic-prs GitHub app will automatically check your PR title when you create or update a pull request. If your PR title doesn't follow the conventions, the check will fail, and you'll need to update your title.

## Cursor Assistance

Cursor will help enforce these rules by:

1. Suggesting conventional PR titles when creating branches
2. Validating PR titles against the conventional format
3. Providing feedback on non-compliant PR titles
4. Suggesting corrections for PR titles that don't meet the requirements

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [semantic-prs GitHub App](https://github.com/Ezard/semantic-prs)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit) 