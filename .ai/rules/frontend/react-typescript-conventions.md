# React / TypeScript Frontend Conventions

## Tech Stack

- React 18, TypeScript (strict mode), Redux + Redux-Saga, styled-components
- Build: Webpack, Yarn 3 (Berry) with workspaces
- Linting: ESLint (Airbnb-based) + Prettier (80 cols, 2-space, double quotes, trailing commas)
- Node: ^20.11.1

## CE-EE Import Pattern (Critical)

- `app/client/src/ce/` — real Community Edition implementations
- `app/client/src/ee/` — re-export stubs in CE: `export * from "ce/..."`
- **Always import from `"ee/..."`, never from `"ce/"` directly** (enforced by ESLint)
- TypeScript path alias: `"ee/*": ["ee/*"]` in `tsconfig.path.json`
- When creating new modules: create `ce/` implementation + matching `ee/` re-export stub
- Frontend feature flags: `useFeatureFlag(flagName)` hook reads from Redux, with dev override support via `window.overrideFeatureFlag()`

## Component Conventions

- Functional components with hooks exclusively (class components only as legacy base classes)
- Props typing: `interface` for extendable shapes (preferred), `type` for unions/intersections
- `@typescript-eslint/no-explicit-any: "error"` — `any` is banned
- `import type` enforced for type-only imports (`@typescript-eslint/consistent-type-imports`)

## Styling

- **styled-components**: primary approach throughout the app
- **CSS Modules** (`.module.css`): secondary, used in WDS widgets and CustomWidgetBuilder
- Design tokens: `--ads-v2-*` prefix (design system), `--color-*` / `--border-*` (WDS)
- Three design system layers:
  - `@appsmith/ads` — 30+ styled-components (primary)
  - Legacy `designSystems/appsmith/` — wraps BlueprintJS
  - `@appsmith/wds` — CSS Modules for widgets
- No Tailwind

## State Management (Redux + Redux-Saga)

### Reducers — handler-map pattern (not switch-case, not Redux Toolkit)

```typescript
const handlers = {
  [ReduxActionTypes.FETCH_DATA]: (state) => ({ ...state, isLoading: true }),
  [ReduxActionTypes.FETCH_DATA_SUCCESS]: (state, action) => ({
    ...state, isLoading: false, data: action.payload,
  }),
};
export default createReducer(initialState, handlers);
```

### Action types — string constants

All defined in `ce/constants/ReduxActionConstants.tsx`, merged into `ReduxActionTypes` and `ReduxActionErrorTypes`. Naming: `_INIT` for trigger, `_SUCCESS` for success, `_ERROR` for error.

### Action creators — plain functions

```typescript
export const fetchData = (id: string) => ({
  type: ReduxActionTypes.FETCH_DATA_INIT,
  payload: { id },
});
```

### Sagas — takeLatest/takeEvery/debounce

```typescript
export default function* dataSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_DATA_INIT, fetchDataSaga),
  ]);
}
```

Worker sagas use try/catch with `call`/`put`/`select`.

### Selectors — plain functions + reselect's createSelector

```typescript
export const getData = (state: DefaultRootState) => state.entities.data;
export const getDerivedData = createSelector(getData, getOther, (data, other) => { ... });
```

## API Calls

- **Axios** exclusively (no fetch API)
- Base URL: `/api/` (relative, same origin)
- Response envelope: `{ responseMeta: { status, success, error? }, data: T }` via `ApiResponse<T>`
- Two patterns coexist:
  - Legacy: class-based extending `Api` base class with static methods
  - Newer: functional factory via `apiFactory()` in `api/core/`
- Error handling: chain-of-responsibility via axios interceptors (401, 404, 413, 502, timeout, offline)

## File & Folder Conventions

| Context | Convention |
|---------|-----------|
| Components / feature dirs | PascalCase (`ModalComponent.tsx`, `ConnectModal/`) |
| Utility dirs | camelCase (`utils/`, `hooks/`, `constants/`) |
| Barrel exports | `index.ts` / `index.tsx` |
| Test files | `<name>.test.ts(x)` in `__tests__/` or adjacent |

Structure: hybrid by-type at top level + by-feature for domains:
- Top-level: `actions/`, `reducers/`, `sagas/`, `selectors/`, `api/`, `hooks/`, `utils/`
- Feature modules (e.g., `git/`, `IDE/`): self-contained with own `components/`, `hooks/`, `store/`
- `ce/` and `ee/` mirror the by-type structure

## ESLint Rules (Notable)

- `no-console: "error"`, `no-debugger: "error"`
- `react/jsx-sort-props: "error"` — JSX props must be alphabetically sorted
- `@appsmith/named-use-effect` — `useEffect` must receive named functions, not arrow functions
- `@appsmith/object-keys` — use `objectKeys()` instead of `Object.keys()`
- Restricted imports: `**/ce/*` (must use `ee/`), `codemirror`, `lottie-web`, `@uppy/*`
- `react-compiler/react-compiler: "warn"` — React compiler compatibility

## Custom Hooks

- 195+ hook files across the codebase
- General-purpose in `utils/hooks/`; domain hooks in feature directories
- All hooks use TypeScript generics where appropriate
- Named function convention enforced by `@appsmith/named-use-effect`

## Build & Verify Commands

```bash
cd app/client && yarn lint              # ESLint
cd app/client && yarn prettier          # Prettier check
cd app/client && yarn test:unit         # Jest unit tests
cd app/client && yarn check-types       # TypeScript type-check
cd app/client && yarn start             # Dev server
```
