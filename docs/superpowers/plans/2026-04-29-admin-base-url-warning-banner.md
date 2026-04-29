# Admin Base-URL Warning Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a non-dismissible top-of-screen banner to instance super-users when `APPSMITH_BASE_URL` is unset and the resolver is in fail-closed mode for token-bearing email flows. Multi-org EE never sees it.

**Architecture:** New reactive method on `SecureBaseUrlResolverCE` exposes the health signal. New boolean field on `UserProfileCE_DTO` carries it to the client via the existing `/v1/users/profile` call. New React component (`BaseUrlMissingBanner`) renders via `Callout` from `@appsmith/ads`, gated on `isSuperUser && adminSettingsVisible && instanceBaseUrlConfigurationHealthy === false`. EE override of the resolver short-circuits to healthy when `license_multi_org_enabled` is on.

**Tech Stack:** Java 17 / Spring Boot Reactive (server), React + TypeScript + Redux (client), JUnit 5 + Reactor Test (server tests), Jest + React Testing Library (client tests).

**Spec:** `docs/superpowers/specs/2026-04-29-admin-base-url-warning-banner-design.md`

**Branch:** `feat/admin-base-url-warning-banner-ghsa-j9gf` (CE main repo at `/Users/subratadeypappu/IdeaProjects/appsmith`); EE work on the same branch name in EE main repo at `/Users/subratadeypappu/IdeaProjects/ee-appsmith` (created in Task 8).

---

## File Structure

### Server CE
- **Modify** `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCE.java` — add interface method
- **Modify** `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCEImpl.java` — implement method
- **Modify** `app/server/appsmith-server/src/test/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCEImplTest.java` — add 2 unit cases
- **Modify** `app/server/appsmith-server/src/main/java/com/appsmith/server/dtos/ce/UserProfileCE_DTO.java` — add boolean field
- **Modify** `app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/UserServiceCEImpl.java` — wire resolver into `buildUserProfileDTO`

### Client CE
- **Modify** `app/client/src/ce/constants/messages.ts` — 3 message keys
- **Modify** `app/client/src/selectors/usersSelectors.ts` — new selector with `=== false` guard
- **Create** `app/client/src/selectors/usersSelectors.test.ts` (or extend existing) — selector test
- **Create** `app/client/src/components/editorComponents/BaseUrlMissingBanner.tsx` — banner component
- **Create** `app/client/src/components/editorComponents/BaseUrlMissingBanner.test.tsx` — Jest tests
- **Modify** `app/client/src/ce/AppRouter.tsx` — mount banner
- **Modify** `app/client/src/constants/userConstants.ts` (if profile type lives there) — extend type

### Server EE
- **Modify** `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/SecureBaseUrlResolverImpl.java` — override method
- **Create / Modify** `app/server/appsmith-server/src/test/java/com/appsmith/server/helpers/SecureBaseUrlResolverImplTest.java` — 3 unit cases

---

## Task 1: Server CE — `SecureBaseUrlResolverCE.isBaseUrlConfigurationHealthy()`

**Files:**
- Modify: `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCE.java`
- Modify: `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCEImpl.java`
- Test: `app/server/appsmith-server/src/test/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCEImplTest.java`

- [ ] **Step 1: Write the failing tests**

Append two test methods to `SecureBaseUrlResolverCEImplTest`:

```java
@Test
void isBaseUrlConfigurationHealthy_returnsTrueWhenBaseUrlSet() {
    SecureBaseUrlResolverCEImpl resolver = new SecureBaseUrlResolverCEImpl();
    ReflectionTestUtils.setField(resolver, "appsmithBaseUrl", "https://appsmith.example");
    StepVerifier.create(resolver.isBaseUrlConfigurationHealthy())
            .expectNext(true)
            .verifyComplete();
}

@Test
void isBaseUrlConfigurationHealthy_returnsFalseWhenBaseUrlBlank() {
    SecureBaseUrlResolverCEImpl resolver = new SecureBaseUrlResolverCEImpl();
    ReflectionTestUtils.setField(resolver, "appsmithBaseUrl", "");
    StepVerifier.create(resolver.isBaseUrlConfigurationHealthy())
            .expectNext(false)
            .verifyComplete();
}
```

(Add `import org.springframework.test.util.ReflectionTestUtils;` and `import reactor.test.StepVerifier;` if not already present.)

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/subratadeypappu/IdeaProjects/appsmith/app/server
./mvnw -pl appsmith-server test -Dtest=SecureBaseUrlResolverCEImplTest -DfailIfNoTests=false
```

Expected: FAIL with "cannot find symbol method isBaseUrlConfigurationHealthy()" (compile error).

- [ ] **Step 3: Add interface method**

In `SecureBaseUrlResolverCE.java`, add:

```java
/**
 * Reports whether this instance is in a state where token-bearing email flows
 * (forgot-password, email verification, invites) can generate links without
 * depending on a request-time hint such as the Origin header. False = the
 * resolver is in fail-closed mode and the admin should configure the canonical
 * base URL.
 */
Mono<Boolean> isBaseUrlConfigurationHealthy();
```

- [ ] **Step 4: Implement in `SecureBaseUrlResolverCEImpl`**

Add method (paste after `resolveSecureBaseUrl`):

```java
@Override
public Mono<Boolean> isBaseUrlConfigurationHealthy() {
    return Mono.just(StringUtils.hasText(appsmithBaseUrl));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Same command as Step 2. Expected: 2 new tests PASS, plus the existing 16 cases still PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/subratadeypappu/IdeaProjects/appsmith
git add app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCE.java \
        app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCEImpl.java \
        app/server/appsmith-server/src/test/java/com/appsmith/server/helpers/ce/SecureBaseUrlResolverCEImplTest.java
git commit -m "feat(security): add isBaseUrlConfigurationHealthy() to SecureBaseUrlResolverCE (GHSA-j9gf-vw2f-9hrw)"
```

---

## Task 2: Server CE — `UserProfileCE_DTO` field

**Files:**
- Modify: `app/server/appsmith-server/src/main/java/com/appsmith/server/dtos/ce/UserProfileCE_DTO.java`

- [ ] **Step 1: Add the field**

Insert after `@JsonProperty("isIntercomConsentGiven")` block (line 40 area, alongside other instance/admin booleans):

```java
    @JsonProperty("instanceBaseUrlConfigurationHealthy")
    boolean instanceBaseUrlConfigurationHealthy = true;
```

Default `true` so any DTO instance built outside the real assembler (test fixtures, mocks) doesn't false-positive the banner.

- [ ] **Step 2: Verify the file compiles**

```bash
cd /Users/subratadeypappu/IdeaProjects/appsmith/app/server
./mvnw -pl appsmith-server compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add app/server/appsmith-server/src/main/java/com/appsmith/server/dtos/ce/UserProfileCE_DTO.java
git commit -m "feat(security): add instanceBaseUrlConfigurationHealthy field to UserProfileCE_DTO (GHSA-j9gf-vw2f-9hrw)"
```

---

## Task 3: Server CE — wire resolver into `UserServiceCEImpl#buildUserProfileDTO`

**Files:**
- Modify: `app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/UserServiceCEImpl.java`
- Test: `app/server/appsmith-server/src/test/java/com/appsmith/server/services/UserServiceTest.java`

- [ ] **Step 1: Read the existing `buildUserProfileDTO` method** (~line 770)

Open the file and study the current `Mono` chain. Identify the terminal `.map`/`.flatMap` step where the `UserProfileDTO` is finalised so the new field can be set there.

- [ ] **Step 2: Write failing integration test**

Add a new test in `UserServiceTest`:

```java
@Test
@WithUserDetails("api_user")
void buildUserProfileDTO_includesBaseUrlConfigurationHealthy() {
    User user = new User();
    user.setEmail("api_user");
    StepVerifier.create(userService.buildUserProfileDTO(user))
            .assertNext(dto -> {
                // In test profile APPSMITH_BASE_URL is unset and the insecure flag is on,
                // so the resolver returns false (the field reflects the resolver, not the flag).
                // For test stability we just assert the field is present and is a boolean.
                Object value = ReflectionTestUtils.getField(dto, "instanceBaseUrlConfigurationHealthy");
                assertThat(value).isInstanceOf(Boolean.class);
            })
            .verifyComplete();
}
```

(Imports: `org.springframework.test.util.ReflectionTestUtils`, `org.assertj.core.api.Assertions.assertThat`.)

- [ ] **Step 3: Run test to verify it fails**

```bash
./mvnw -pl appsmith-server test -Dtest=UserServiceTest#buildUserProfileDTO_includesBaseUrlConfigurationHealthy -DfailIfNoTests=false
```

Expected: FAIL — current DTO build doesn't set the field, default `true` is returned, but the test asserts type only so it'll pass. **Adjust:** change the assertion to `assertThat((Boolean) value).isFalse();` since the resolver in test profile (where `APPSMITH_BASE_URL` is unset) returns `false`. Re-run; should fail because the wiring isn't in place yet (field stays at the DTO default of `true`).

- [ ] **Step 4: Inject the resolver field**

In the field declarations of `UserServiceCEImpl` (where other dependencies are listed), add:

```java
private final SecureBaseUrlResolverCE secureBaseUrlResolver;
```

In the constructor, append the parameter (preserving existing parameter order; add at the end if mutating order would risk EE-side conflicts):

```java
SecureBaseUrlResolverCE secureBaseUrlResolver,
```

And in the constructor body:

```java
this.secureBaseUrlResolver = secureBaseUrlResolver;
```

- [ ] **Step 5: Wire into the `buildUserProfileDTO` chain**

In the terminal `.map` (or `.flatMap`) step that finalises the DTO, replace it with a `.zipWith` so the resolver call runs in parallel. The exact shape depends on the existing method body; pattern:

```java
return existingMonoChain
        .zipWith(secureBaseUrlResolver.isBaseUrlConfigurationHealthy().onErrorReturn(true))
        .map(tuple -> {
            UserProfileDTO dto = tuple.getT1();
            dto.setInstanceBaseUrlConfigurationHealthy(tuple.getT2());
            return dto;
        });
```

The `.onErrorReturn(true)` defends against resolver Mono errors per the spec's "Error handling" section — a transient failure must not break login.

- [ ] **Step 6: Run test to verify it passes**

Same command as Step 3. Expected: PASS.

- [ ] **Step 7: Run the broader UserServiceTest suite**

```bash
./mvnw -pl appsmith-server test -Dtest=UserServiceTest -DfailIfNoTests=false
```

Expected: All cases PASS (no regression in the existing 30+ cases).

- [ ] **Step 8: Commit**

```bash
git add app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/UserServiceCEImpl.java \
        app/server/appsmith-server/src/test/java/com/appsmith/server/services/UserServiceTest.java
git commit -m "feat(security): wire SecureBaseUrlResolver into UserServiceCEImpl#buildUserProfileDTO (GHSA-j9gf-vw2f-9hrw)"
```

---

## Task 4: Client CE — message constants

**Files:**
- Modify: `app/client/src/ce/constants/messages.ts`

- [ ] **Step 1: Add three message constants**

Find a logical section (near other admin/setup messages) and append:

```ts
export const BASE_URL_MISSING_BANNER_TITLE = () =>
  "Email delivery is disabled on this instance";

export const BASE_URL_MISSING_BANNER_BODY = () =>
  "Forgot-password, email-verification, and invite emails will not be delivered until APPSMITH_BASE_URL is configured. Set it from Admin Settings to restore email-based flows.";

export const BASE_URL_MISSING_BANNER_CTA = () => "Configure APPSMITH_BASE_URL";
```

- [ ] **Step 2: Verify file parses (TypeScript)**

```bash
cd /Users/subratadeypappu/IdeaProjects/appsmith/app/client
yarn tsc --noEmit -p tsconfig.json 2>&1 | grep -E "messages\.ts|error" | head -20
```

Expected: no errors related to `messages.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/client/src/ce/constants/messages.ts
git commit -m "feat(client): add admin base-url banner copy constants (GHSA-j9gf-vw2f-9hrw)"
```

---

## Task 5: Client CE — selector with `=== false` guard

**Files:**
- Modify: `app/client/src/selectors/usersSelectors.ts`
- Test: `app/client/src/selectors/usersSelectors.test.ts` (create if missing)

- [ ] **Step 1: Write the failing tests**

Create or extend `app/client/src/selectors/usersSelectors.test.ts`:

```ts
import { getShouldShowBaseUrlMissingBanner } from "./usersSelectors";

const baseState = (currentUser: object | null) =>
  ({ ui: { users: { currentUser } } } as never);

describe("getShouldShowBaseUrlMissingBanner", () => {
  it("returns true when super user, settings visible, and unhealthy", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        baseState({
          isSuperUser: true,
          adminSettingsVisible: true,
          instanceBaseUrlConfigurationHealthy: false,
        }),
      ),
    ).toBe(true);
  });

  it("returns false when healthy", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        baseState({
          isSuperUser: true,
          adminSettingsVisible: true,
          instanceBaseUrlConfigurationHealthy: true,
        }),
      ),
    ).toBe(false);
  });

  it("returns false when not super user", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        baseState({
          isSuperUser: false,
          adminSettingsVisible: true,
          instanceBaseUrlConfigurationHealthy: false,
        }),
      ),
    ).toBe(false);
  });

  it("returns false when admin settings not visible", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        baseState({
          isSuperUser: true,
          adminSettingsVisible: false,
          instanceBaseUrlConfigurationHealthy: false,
        }),
      ),
    ).toBe(false);
  });

  it("returns false when field is missing (rolling deploy safety)", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        baseState({
          isSuperUser: true,
          adminSettingsVisible: true,
        }),
      ),
    ).toBe(false);
  });

  it("returns false when currentUser is null", () => {
    expect(getShouldShowBaseUrlMissingBanner(baseState(null))).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/subratadeypappu/IdeaProjects/appsmith/app/client
yarn jest src/selectors/usersSelectors.test.ts
```

Expected: FAIL with "getShouldShowBaseUrlMissingBanner is not a function".

- [ ] **Step 3: Add the selector**

Append to `app/client/src/selectors/usersSelectors.ts`:

```ts
export const getShouldShowBaseUrlMissingBanner = (
  state: AppState,
): boolean => {
  const user = state.ui.users.currentUser;
  return Boolean(
    user?.isSuperUser &&
      user?.adminSettingsVisible &&
      user?.instanceBaseUrlConfigurationHealthy === false,
  );
};
```

(Confirm `AppState` is already imported at the top of the file; if not, add `import type { AppState } from "ee/reducers";` matching the existing convention there.)

- [ ] **Step 4: Run tests to verify they pass**

Same command as Step 2. Expected: 6/6 PASS.

- [ ] **Step 5: Extend the user-profile TypeScript shape**

If the `currentUser` shape is declared (search by ripgrep for `isSuperUser` in `.ts`/`.tsx`), add the optional field:

```ts
instanceBaseUrlConfigurationHealthy?: boolean;
```

If no explicit interface exists (it's inferred), the selector compiles via the `user?.instanceBaseUrlConfigurationHealthy === false` access without further work.

- [ ] **Step 6: Commit**

```bash
git add app/client/src/selectors/usersSelectors.ts app/client/src/selectors/usersSelectors.test.ts
# include the type sync file if you found one
git commit -m "feat(client): add getShouldShowBaseUrlMissingBanner selector (GHSA-j9gf-vw2f-9hrw)"
```

---

## Task 6: Client CE — `BaseUrlMissingBanner` component

**Files:**
- Create: `app/client/src/components/editorComponents/BaseUrlMissingBanner.tsx`
- Create: `app/client/src/components/editorComponents/BaseUrlMissingBanner.test.tsx`

- [ ] **Step 1: Write the failing component tests**

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, lightTheme } from "@appsmith/ads-old";
import BaseUrlMissingBanner from "./BaseUrlMissingBanner";

const renderWithStore = (currentUser: object | null) => {
  const store = createStore(() => ({
    ui: { users: { currentUser } },
  }));
  return render(
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <MemoryRouter>
          <BaseUrlMissingBanner />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
};

describe("BaseUrlMissingBanner", () => {
  it("renders for super user with unhealthy configuration", () => {
    renderWithStore({
      isSuperUser: true,
      adminSettingsVisible: true,
      instanceBaseUrlConfigurationHealthy: false,
    });
    expect(screen.getByText(/Email delivery is disabled/i)).toBeInTheDocument();
  });

  it("does not render when configuration is healthy", () => {
    const { container } = renderWithStore({
      isSuperUser: true,
      adminSettingsVisible: true,
      instanceBaseUrlConfigurationHealthy: true,
    });
    expect(container.firstChild).toBeNull();
  });

  it("does not render for non-super-user", () => {
    const { container } = renderWithStore({
      isSuperUser: false,
      adminSettingsVisible: true,
      instanceBaseUrlConfigurationHealthy: false,
    });
    expect(container.firstChild).toBeNull();
  });

  it("does not render when admin settings hidden", () => {
    const { container } = renderWithStore({
      isSuperUser: true,
      adminSettingsVisible: false,
      instanceBaseUrlConfigurationHealthy: false,
    });
    expect(container.firstChild).toBeNull();
  });

  it("does not render when field missing (rolling deploy)", () => {
    const { container } = renderWithStore({
      isSuperUser: true,
      adminSettingsVisible: true,
    });
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn jest src/components/editorComponents/BaseUrlMissingBanner.test.tsx
```

Expected: FAIL with "Cannot find module './BaseUrlMissingBanner'".

- [ ] **Step 3: Create the component**

```tsx
import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Callout } from "@appsmith/ads";
import { getShouldShowBaseUrlMissingBanner } from "selectors/usersSelectors";
import { adminSettingsCategoryUrl } from "ee/RouteBuilder";
import { SettingCategories } from "ee/pages/AdminSettings/config/types";
import {
  BASE_URL_MISSING_BANNER_BODY,
  BASE_URL_MISSING_BANNER_CTA,
  BASE_URL_MISSING_BANNER_TITLE,
  createMessage,
} from "ee/constants/messages";

const BannerContainer = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: var(--ads-v2-z-index-9, 100);
`;

const BaseUrlMissingBanner: React.FC = () => {
  const shouldShow = useSelector(getShouldShowBaseUrlMissingBanner);

  if (!shouldShow) return null;

  return (
    <BannerContainer data-testid="base-url-missing-banner">
      <Callout
        kind="warning"
        links={[
          {
            children: createMessage(BASE_URL_MISSING_BANNER_CTA),
            to: adminSettingsCategoryUrl({
              category: SettingCategories.CONFIGURATION,
            }),
          },
        ]}
      >
        <strong>{createMessage(BASE_URL_MISSING_BANNER_TITLE)}</strong>
        <br />
        <span>{createMessage(BASE_URL_MISSING_BANNER_BODY)}</span>
      </Callout>
    </BannerContainer>
  );
};

export default BaseUrlMissingBanner;
```

- [ ] **Step 4: Run tests to verify they pass**

Same command as Step 2. Expected: 5/5 PASS.

If the test fails because of `Callout` requiring additional theme/wiring, inspect the failure and either (a) use `data-testid` selectors instead of text, or (b) wrap the component test in the same provider wrappers used by `ProductAlertBanner.test.tsx` if that file exists; otherwise stick with the wrappers in Step 1.

- [ ] **Step 5: Commit**

```bash
git add app/client/src/components/editorComponents/BaseUrlMissingBanner.tsx \
        app/client/src/components/editorComponents/BaseUrlMissingBanner.test.tsx
git commit -m "feat(client): add BaseUrlMissingBanner component (GHSA-j9gf-vw2f-9hrw)"
```

---

## Task 7: Client CE — mount banner in `AppRouter`

**Files:**
- Modify: `app/client/src/ce/AppRouter.tsx`

- [ ] **Step 1: Find the existing mount of `<ProductAlertBanner />`**

Search in `AppRouter.tsx` for `ProductAlertBanner`. The mount sits inside the authed-routes container (around line 195).

- [ ] **Step 2: Import and mount the new banner above `AppHeader`**

Add to imports:

```tsx
import BaseUrlMissingBanner from "components/editorComponents/BaseUrlMissingBanner";
```

In the JSX where `<AppHeader />` and `<Routes />` are rendered (around line 192-195), wrap them so the new banner sits above `<AppHeader />`:

```tsx
<>
  <BaseUrlMissingBanner />
  <Walkthrough>
    <AppHeader />
    <Routes />
  </Walkthrough>
  <ProductAlertBanner />
</>
```

(Preserve the existing structure exactly — only add the `<BaseUrlMissingBanner />` line above `<Walkthrough>`. The fragment may already exist.)

- [ ] **Step 3: Verify TypeScript compiles**

```bash
yarn tsc --noEmit -p tsconfig.json 2>&1 | grep "AppRouter.tsx" | head -5
```

Expected: no errors.

- [ ] **Step 4: Smoke-render the affected file's tests if any**

```bash
yarn jest src/ce/AppRouter --passWithNoTests
```

Expected: PASS or "no tests found".

- [ ] **Step 5: Commit**

```bash
git add app/client/src/ce/AppRouter.tsx
git commit -m "feat(client): mount BaseUrlMissingBanner above AppHeader (GHSA-j9gf-vw2f-9hrw)"
```

---

## Task 8: Server EE — multi-org-aware override

**Files:**
- Switch repo: `/Users/subratadeypappu/IdeaProjects/ee-appsmith` (main repo, NOT a worktree — husky hook is broken in worktrees per `.security/ghsa-j9gf-vw2f-9hrw/state.md`)
- Modify: `app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/SecureBaseUrlResolverImpl.java`
- Test: `app/server/appsmith-server/src/test/java/com/appsmith/server/helpers/SecureBaseUrlResolverImplTest.java` (create if missing)

- [ ] **Step 1: Switch EE main repo to a new branch on this work**

```bash
cd /Users/subratadeypappu/IdeaProjects/ee-appsmith
git stash push -u -m "WIP: parking SAST branch for banner work"
git checkout fix/origin-validation-email-links-ghsa-j9gf  # base on the GHSA fix branch which has resolver scaffolding
git pull origin fix/origin-validation-email-links-ghsa-j9gf
git checkout -b feat/admin-base-url-warning-banner-ghsa-j9gf
```

- [ ] **Step 2: Cherry-pick the CE-only commits onto the EE branch (shadow PR pattern)**

For each CE commit on `feat/admin-base-url-warning-banner-ghsa-j9gf` (Tasks 1-7), cherry-pick into EE:

```bash
git -C /Users/subratadeypappu/IdeaProjects/ee-appsmith cherry-pick \
  $(git -C /Users/subratadeypappu/IdeaProjects/appsmith log --reverse --format=%H release..feat/admin-base-url-warning-banner-ghsa-j9gf -- app/server app/client)
```

If conflicts arise, resolve manually (most likely on `UserProfileCE_DTO.java` if EE has any divergent fields). For the spec/plan docs, skip them on the EE side — they only need to live in CE.

- [ ] **Step 3: Write failing EE override tests**

Create `app/server/appsmith-server/src/test/java/com/appsmith/server/helpers/SecureBaseUrlResolverImplTest.java`:

```java
package com.appsmith.server.helpers;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SecureBaseUrlResolverImplTest {

    @Test
    void isBaseUrlConfigurationHealthy_returnsTrueWhenMultiOrgEnabled() {
        FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
        OrganizationService organizationService = mock(OrganizationService.class);
        when(featureFlagService.check(eq(FeatureFlagEnum.license_multi_org_enabled)))
                .thenReturn(Mono.just(true));

        SecureBaseUrlResolverImpl resolver =
                new SecureBaseUrlResolverImpl(featureFlagService, organizationService);
        ReflectionTestUtils.setField(resolver, "appsmithBaseUrl", "");

        StepVerifier.create(resolver.isBaseUrlConfigurationHealthy())
                .expectNext(true)
                .verifyComplete();
    }

    @Test
    void isBaseUrlConfigurationHealthy_delegatesWhenMultiOrgDisabledAndUrlSet() {
        FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
        OrganizationService organizationService = mock(OrganizationService.class);
        when(featureFlagService.check(eq(FeatureFlagEnum.license_multi_org_enabled)))
                .thenReturn(Mono.just(false));

        SecureBaseUrlResolverImpl resolver =
                new SecureBaseUrlResolverImpl(featureFlagService, organizationService);
        ReflectionTestUtils.setField(resolver, "appsmithBaseUrl", "https://appsmith.example");

        StepVerifier.create(resolver.isBaseUrlConfigurationHealthy())
                .expectNext(true)
                .verifyComplete();
    }

    @Test
    void isBaseUrlConfigurationHealthy_delegatesWhenMultiOrgDisabledAndUrlUnset() {
        FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
        OrganizationService organizationService = mock(OrganizationService.class);
        when(featureFlagService.check(eq(FeatureFlagEnum.license_multi_org_enabled)))
                .thenReturn(Mono.just(false));

        SecureBaseUrlResolverImpl resolver =
                new SecureBaseUrlResolverImpl(featureFlagService, organizationService);
        ReflectionTestUtils.setField(resolver, "appsmithBaseUrl", "");

        StepVerifier.create(resolver.isBaseUrlConfigurationHealthy())
                .expectNext(false)
                .verifyComplete();
    }
}
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd /Users/subratadeypappu/IdeaProjects/ee-appsmith/app/server
./mvnw -pl appsmith-server test -Dtest=SecureBaseUrlResolverImplTest -DfailIfNoTests=false
```

Expected: FAIL — the override hasn't been added yet, so the EE class inherits the CE method which ignores multi-org. Test 1 fails (returns false instead of true).

- [ ] **Step 5: Add the override to `SecureBaseUrlResolverImpl`**

Append the new method (after `resolveSecureBaseUrl`):

```java
@Override
public Mono<Boolean> isBaseUrlConfigurationHealthy() {
    return featureFlagService
            .check(FeatureFlagEnum.license_multi_org_enabled)
            .flatMap(isMultiOrgEnabled -> Boolean.TRUE.equals(isMultiOrgEnabled)
                    ? Mono.just(true)
                    : super.isBaseUrlConfigurationHealthy())
            .onErrorResume(e -> {
                log.warn(
                        "FeatureFlagService.check failed for license_multi_org_enabled; defaulting to single-org behavior: {}",
                        e.getMessage());
                return super.isBaseUrlConfigurationHealthy();
            });
}
```

- [ ] **Step 6: Run tests to verify they pass**

Same command as Step 4. Expected: 3/3 PASS.

- [ ] **Step 7: Commit on the EE branch**

```bash
cd /Users/subratadeypappu/IdeaProjects/ee-appsmith
git add app/server/appsmith-server/src/main/java/com/appsmith/server/helpers/SecureBaseUrlResolverImpl.java \
        app/server/appsmith-server/src/test/java/com/appsmith/server/helpers/SecureBaseUrlResolverImplTest.java
git commit -m "feat(security): EE multi-org override for isBaseUrlConfigurationHealthy (GHSA-j9gf-vw2f-9hrw)"
```

- [ ] **Step 8: Push EE branch**

```bash
git push -u origin feat/admin-base-url-warning-banner-ghsa-j9gf
```

---

## Task 9: CE — sync test, push, open PRs

- [ ] **Step 1: Verify CE→EE sync would apply cleanly (per AGENTS.md)**

```bash
cd /Users/subratadeypappu/IdeaProjects/appsmith
git fetch community release
git checkout -b _sync-test-banner community/release
for sha in $(git log --reverse --format=%H release..feat/admin-base-url-warning-banner-ghsa-j9gf); do
  git cherry-pick $sha || { echo "CONFLICT on $sha"; break; }
done
git checkout feat/admin-base-url-warning-banner-ghsa-j9gf
git branch -D _sync-test-banner
```

Expected: All commits cherry-pick cleanly. Any conflict means a CE file diverges from `community/release` — investigate and resolve before opening the PR.

- [ ] **Step 2: Push CE branch**

```bash
git push -u origin feat/admin-base-url-warning-banner-ghsa-j9gf
```

- [ ] **Step 3: Open CE PR**

```bash
gh pr create --repo appsmithorg/appsmith \
  --base release \
  --title "feat(security): admin warning banner for unset APPSMITH_BASE_URL (GHSA-j9gf-vw2f-9hrw)" \
  --body "$(cat <<'EOF'
## Summary

Companion to PR #41766 (the GHSA-j9gf-vw2f-9hrw fail-closed fix).

Adds a non-dismissible top-of-screen banner shown only to instance super-users when `APPSMITH_BASE_URL` is unset and the resolver is therefore in fail-closed mode for token-bearing email flows. Multi-org EE deployments (e.g. Appsmith Cloud) **never** see the banner — verified via the `license_multi_org_enabled` short-circuit in the EE resolver override (shadow EE PR linked below).

The banner deep-links to Admin Settings → Configuration where `APPSMITH_BASE_URL` is the registered field. Saving via the existing Configuration-tier admin-settings flow restarts the server, the SPA auto-reloads, the resolver re-reads the env, and the banner clears — no re-login.

## Design

`docs/superpowers/specs/2026-04-29-admin-base-url-warning-banner-design.md`

## Plan

`docs/superpowers/plans/2026-04-29-admin-base-url-warning-banner.md`

## Test plan

- [x] `SecureBaseUrlResolverCEImplTest` — 2 new cases for `isBaseUrlConfigurationHealthy()`
- [x] `UserServiceTest` — 1 new case asserting field is wired into `buildUserProfileDTO`
- [x] `usersSelectors.test.ts` — 6 cases including rolling-deploy `=== false` guard
- [x] `BaseUrlMissingBanner.test.tsx` — 5 cases covering all gating dimensions
- Cypress: skipped — CI sets `APPSMITH_BASE_URL=http://localhost`, banner never fires by construction

## Companion PRs / refs

- Shadow EE PR: <fill in URL after Task 8 push>
- Security advisory: https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw
- Linear: APP-15046
EOF
)"
```

- [ ] **Step 4: Open shadow EE PR**

```bash
cd /Users/subratadeypappu/IdeaProjects/ee-appsmith
gh pr create --repo appsmithorg/appsmith-ee \
  --base release \
  --title "feat(security): admin warning banner for unset APPSMITH_BASE_URL (GHSA-j9gf-vw2f-9hrw)" \
  --body "$(cat <<'EOF'
## Summary

Shadow EE PR for CE PR #<fill in CE PR number>. Mirrors the CE work and adds the EE-only `SecureBaseUrlResolverImpl` override for `isBaseUrlConfigurationHealthy()` that short-circuits to `Mono.just(true)` when `license_multi_org_enabled` is on (so multi-org EE deployments — Appsmith Cloud — never display the banner).

## Merge order

1. CE PR merges first
2. CE→EE hourly sync brings the CE files into EE (cleanly — sync test passed before opening the CE PR)
3. This shadow EE PR merges on top with a merge commit (NOT squash — squashing breaks the next sync)

## Companion PRs / refs

- CE PR: <fill in URL>
- Security advisory: https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw
- Linear: APP-15046
EOF
)"
```

- [ ] **Step 5: Add shared labels**

```bash
gh pr edit --repo appsmithorg/appsmith <CE PR #> --add-label security
gh pr edit --repo appsmithorg/appsmith-ee <EE PR #> --add-label security
```

- [ ] **Step 6: Restore EE main repo to its prior state**

```bash
cd /Users/subratadeypappu/IdeaProjects/ee-appsmith
git checkout feature/app-15191-sast-semgrep-integration
git stash pop
```

---

## Self-Review Notes

- Spec coverage: every section in the spec ("Architecture", "Multi-org", "Error handling", "Edge cases", "Testing", "Out of scope") is anchored to a specific task above (1-9).
- No placeholders: every code block contains executable code or executable commands. PR-body URLs are deliberately marked `<fill in>` because they're computed at PR-open time.
- Type consistency: `instanceBaseUrlConfigurationHealthy` (Java + TS), `isBaseUrlConfigurationHealthy()` (Java method), `getShouldShowBaseUrlMissingBanner` (TS selector), `BaseUrlMissingBanner` (component) — all consistent across tasks.
