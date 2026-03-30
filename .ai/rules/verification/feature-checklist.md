# Feature Implementation Checklist

## Planning

- [ ] Understand requirements and acceptance criteria
- [ ] Design the implementation approach before writing code
- [ ] Identify which components need the CE → CE-Compatible → EE pattern

## Implementation

### Backend (if applicable)
- [ ] Create full CE → CE-Compatible → EE chain for new services/controllers/repositories
- [ ] `@Service` only on the final `*Impl` class
- [ ] New API endpoints: `Mono<ResponseDTO<T>>` return type, `@JsonView(Views.Public.class)`
- [ ] Add URL path constant to `UrlCE.java`
- [ ] Error handling via `AppsmithException(AppsmithError.XXX)`
- [ ] Add `@FeatureFlagged` if the feature should be gated behind a flag
- [ ] New feature flag? Add to `FeatureFlagEnum` in `appsmith-interfaces`

### Frontend (if applicable)
- [ ] Create `ce/` implementation + `ee/` re-export stub for new modules
- [ ] Import from `"ee/..."` everywhere — never `"ce/"` directly
- [ ] Follow Redux handler-map pattern for new state (not switch-case)
- [ ] Action types: `_INIT`, `_SUCCESS`, `_ERROR` naming convention
- [ ] New feature flag? Add to `FeatureFlag` in `ce/entities/FeatureFlag.ts` + use `useFeatureFlag()`
- [ ] Styled-components for new UI; design tokens via `--ads-v2-*`
- [ ] JSX props alphabetically sorted (enforced by ESLint)
- [ ] Named functions in `useEffect` (enforced by `@appsmith/named-use-effect`)

## Testing

- [ ] Write unit tests covering the new functionality
- [ ] Test both feature-flag-on and feature-flag-off paths if applicable
- [ ] Server test: `cd app/server && source envs/test.env.example && mvn test -pl appsmith-server -Dtest=ClassName`
- [ ] Client test: `cd app/client && yarn test:unit`
- [ ] Consider edge cases: empty state, error state, large data, concurrent access

## Accessibility (for UI features)

- [ ] ARIA attributes on interactive elements
- [ ] Keyboard navigation support
- [ ] Semantic HTML elements where appropriate

## Before Committing

- [ ] Formatting handled automatically by Husky pre-commit hooks
- [ ] PR title: `feat(scope): description`
- [ ] Documentation updated if the feature has user-facing changes
