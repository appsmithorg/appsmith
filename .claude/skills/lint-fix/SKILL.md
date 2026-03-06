# Lint Fix Skill

## Steps
1. Run `npx eslint . --format json 2>/dev/null | head -200` to get current warning count and categories
2. Group warnings by rule (e.g., @typescript-eslint/no-unused-vars, no-unused-imports)
3. For auto-fixable rules, run `npx eslint . --fix --rule '{"rule-name": "error"}'` one rule at a time
4. For non-auto-fixable (like unused imports), batch by file and manually remove
5. After each batch of changes, re-run eslint to confirm count decreased
6. Report: starting count, ending count, remaining warnings by category

## Important
- Never remove type-only imports without checking if they're used as types
- Never modify test files without verifying method names match current source
- Commit after every ~50 warnings fixed with message: `fix: remove N lint warnings (X remaining)`
