# React / TypeScript Frontend Conventions

## Tech Stack

- React 18, TypeScript (strict mode), Redux + Redux-Saga, styled-components
- Build: Webpack, Yarn 3 (Berry) with workspaces
- Linting: ESLint (Airbnb-based) + Prettier (80 cols, 2-space, double quotes, trailing commas)

## CE-EE Import Pattern (Critical)

- **Always import from `"ee/..."`, never from `"ce/"` directly** (enforced by ESLint)
- `app/client/src/ce/` — real CE implementations; `app/client/src/ee/` — re-export stubs
- TypeScript path alias: `"ee/*": ["ee/*"]` in `tsconfig.path.json`
- New modules: create `ce/` implementation + matching `ee/` re-export stub
- Feature flags: `useFeatureFlag(flagName)` hook from `"utils/hooks/useFeatureFlag"`

## Component Conventions

- Functional components with hooks exclusively
- Props: `interface` for extendable shapes (preferred), `type` for unions
- `any` is banned (`@typescript-eslint/no-explicit-any: "error"`)
- `import type` enforced for type-only imports

## Styling

- **styled-components** primary; CSS Modules secondary (WDS widgets)
- Design tokens: `--ads-v2-*` (design system), `--color-*` (WDS). No Tailwind.

## State Management

- Redux handler-map pattern via `createReducer(initialState, handlers)` — not switch-case, not Redux Toolkit
- Action types in `ce/constants/ReduxActionConstants.tsx`: `_INIT`, `_SUCCESS`, `_ERROR`
- Sagas with `takeLatest`/`takeEvery`/`debounce` in `yield all([...])`
- Selectors: plain functions + `createSelector` from reselect

## API Calls

- Axios exclusively. Base URL: `/api/`. Response: `ApiResponse<T>` envelope.
- Legacy class-based `Api` + newer functional `apiFactory()` in `api/core/`

## ESLint Rules

- `no-console: "error"`, `react/jsx-sort-props: "error"`
- `@appsmith/named-use-effect` — useEffect must receive named functions
- `@appsmith/object-keys` — use `objectKeys()` not `Object.keys()`
- Restricted imports: `**/ce/*`, `codemirror`, `lottie-web`, `@uppy/*`

## File Naming

- Components: PascalCase. Utilities: camelCase. Tests: `<name>.test.ts(x)`
- Hybrid structure: by-type top-level + by-feature for domains

## Commands

```bash
yarn lint && yarn prettier && yarn test:unit && yarn check-types
```
