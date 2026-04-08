# HTML Lang Attribute Customization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow Appsmith app builders to set the `<html lang="">` attribute per-application, preventing browsers and extensions from auto-translating content incorrectly.

**Architecture:** Three-layer approach executed in priority order:
1. **Immediate defence** — add `<meta name="google" content="notranslate">` and `translate="no"` to the app shell so browsers stop auto-translating by default.
2. **Per-app language setting** — add a `htmlLang` field to the Application model (server + client), expose it in App Settings > General, and apply it at runtime via `react-helmet`'s `htmlAttributes`.
3. **Instance-level default** — add an `APPSMITH_DEFAULT_HTML_LANG` environment variable so self-hosted admins can set a default language for all apps on their instance.

**Tech Stack:** React 18, react-helmet, Redux, Java 17 / Spring Boot (server), MongoDB (persistence), Caddy (deploy)

**Issue:** https://github.com/appsmithorg/appsmith-ee/issues/6642

---

## Phase 1 — Immediate Anti-Translation Defence

### Task 1: Add notranslate meta tag to index.html

**Files:**
- Modify: `app/client/public/index.html:2-4`
- Modify: `app/client/public/404.html:2`
- Modify: `deploy/docker/fs/opt/appsmith/templates/loading.html:2`

**Step 1: Edit `app/client/public/index.html`**

Change line 2 from:
```html
<html lang="en">
```
to:
```html
<html lang="en" translate="no">
```

And add inside `<head>` (after the charset meta):
```html
<meta name="google" content="notranslate" />
```

**Step 2: Edit `app/client/public/404.html`**

Same changes: add `translate="no"` to `<html>` tag and add the notranslate meta in `<head>`.

**Step 3: Edit `deploy/docker/fs/opt/appsmith/templates/loading.html`**

Same changes.

**Step 4: Verify locally**

Open the app in Chrome with auto-translate enabled. Confirm the translate bar no longer appears.

**Step 5: Commit**

```bash
git add app/client/public/index.html app/client/public/404.html deploy/docker/fs/opt/appsmith/templates/loading.html
git commit -m "fix: add notranslate directives to prevent unintended browser translation"
```

---

## Phase 2 — Per-App Language Setting (Server)

### Task 2: Add `htmlLang` field to the Application domain

**Files:**
- Modify: `app/server/appsmith-server/src/main/java/com/appsmith/server/domains/ce/ApplicationDetailCE.java`

**Step 1: Add the field**

Add after the `themeSetting` field:

```java
@JsonView({Views.Public.class, Git.class})
String htmlLang;
```

The field is nullable. When `null`, the client falls back to the instance default or `"en"`.

**Step 2: Verify compilation**

```bash
cd app/server && ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add app/server/appsmith-server/src/main/java/com/appsmith/server/domains/ce/ApplicationDetailCE.java
git commit -m "feat: add htmlLang field to ApplicationDetail domain"
```

---

### Task 3: Verify the update API accepts the new field automatically

**Context:** `ApplicationDetailCE` is serialized/deserialized by Jackson. The existing `updateApplication` endpoint already accepts partial `applicationDetail` updates (used by navigation and theme settings). No controller changes are needed — the new field will be accepted automatically because the DTO maps directly from the domain.

**Step 1: Write a test to confirm round-trip**

Find the existing application update test class. Add a test:

- File: `app/server/appsmith-server/src/test/java/com/appsmith/server/solutions/ApplicationFetcherTest.java` (or nearest existing test for application update)

If no convenient test file exists, verify manually:

```bash
cd app/server && ./gradlew test --tests "*ApplicationService*"
```

**Step 2: Commit**

```bash
git commit -m "test: verify htmlLang field persists through application update"
```

---

## Phase 3 — Per-App Language Setting (Client)

### Task 4: Extend TypeScript types

**Files:**
- Modify: `app/client/src/entities/Application/types.ts:37-41` (inside `applicationDetail`)
- Modify: `app/client/src/ce/api/ApplicationApi.tsx:124-128` (inside `UpdateApplicationPayload.applicationDetail`)

**Step 1: Add `htmlLang` to `ApplicationPayload`**

In `app/client/src/entities/Application/types.ts`, inside the `applicationDetail` optional object, add:

```typescript
applicationDetail?: {
  appPositioning?: LayoutSystemTypeConfig;
  navigationSetting?: NavigationSetting;
  themeSetting?: ThemeSetting;
  htmlLang?: string;
};
```

**Step 2: Add `htmlLang` to `UpdateApplicationPayload`**

In `app/client/src/ce/api/ApplicationApi.tsx`, inside the `applicationDetail` field of `UpdateApplicationPayload`:

```typescript
applicationDetail?: {
  navigationSetting?: NavigationSetting;
  themeSetting?: ThemeSetting;
  appPositioning?: LayoutSystemTypeConfig;
  htmlLang?: string;
};
```

**Step 3: Verify TypeScript compiles**

```bash
cd app/client && yarn tsc --noEmit
```

Expected: no new errors.

**Step 4: Commit**

```bash
git add app/client/src/entities/Application/types.ts app/client/src/ce/api/ApplicationApi.tsx
git commit -m "feat: add htmlLang to client application types"
```

---

### Task 5: Add language selector to General Settings

**Files:**
- Modify: `app/client/src/pages/AppIDE/components/AppSettings/components/GeneralSettings.tsx`
- Modify: `app/client/src/ee/constants/messages.ts` (add new message constants)

**Step 1: Add message constants**

In the messages file (find via existing `GENERAL_SETTINGS_APP_NAME_LABEL`), add:

```typescript
export const GENERAL_SETTINGS_APP_LANGUAGE_LABEL = () => "HTML Language";
export const GENERAL_SETTINGS_APP_LANGUAGE_TOOLTIP = () =>
  "Sets the lang attribute on the <html> tag of your published app. This tells browsers what language your content is in, preventing unwanted auto-translation. Use a BCP 47 code (e.g. en, de, fr, ja).";
```

**Step 2: Add the language input to GeneralSettings**

In `GeneralSettings.tsx`, add state for `htmlLang`:

```typescript
const [htmlLang, setHtmlLang] = useState(
  application?.applicationDetail?.htmlLang || "",
);
```

Add a `useEffect` to keep it in sync:

```typescript
useEffect(
  function updateHtmlLang() {
    setHtmlLang(application?.applicationDetail?.htmlLang || "");
  },
  [application?.applicationDetail?.htmlLang],
);
```

Add a save handler (debounced, following the same pattern as `updateAppSettings`):

```typescript
const saveHtmlLang = useCallback(
  debounce((value: string) => {
    const trimmed = value.trim().toLowerCase();
    dispatch(
      updateApplication(applicationId, {
        currentApp: true,
        applicationDetail: {
          ...application?.applicationDetail,
          htmlLang: trimmed || undefined,
        },
      }),
    );
  }, 600),
  [applicationId, application?.applicationDetail, dispatch],
);
```

Add the UI between the icon selector and the static URL section:

```tsx
<div className="pt-2 pb-2">
  <Input
    defaultValue={htmlLang}
    id="t--general-settings-app-language"
    label={createMessage(GENERAL_SETTINGS_APP_LANGUAGE_LABEL)}
    onBlur={() => saveHtmlLang(htmlLang)}
    onChange={(value: string) => setHtmlLang(value)}
    onKeyPress={(ev: React.KeyboardEvent) => {
      if (ev.key === "Enter") {
        saveHtmlLang(htmlLang);
      }
    }}
    placeholder="en"
    size="md"
    type="text"
    value={htmlLang}
  />
  <Text className="mt-1" kind="body-s">
    {createMessage(GENERAL_SETTINGS_APP_LANGUAGE_TOOLTIP)}
  </Text>
</div>
```

**Step 3: Verify the UI renders**

```bash
cd app/client && yarn start
```

Open the editor, go to App Settings > General. Confirm the "HTML Language" input appears below the icon selector.

**Step 4: Commit**

```bash
git add app/client/src/pages/AppIDE/components/AppSettings/components/GeneralSettings.tsx
git add app/client/src/ee/constants/messages.ts  # or wherever messages are added
git commit -m "feat: add HTML Language input to App Settings > General"
```

---

### Task 6: Apply `htmlLang` at runtime via react-helmet in the App Viewer

**Files:**
- Modify: `app/client/src/pages/AppViewer/AppViewerHtmlTitle.tsx`

**Step 1: Add `lang` prop and use `htmlAttributes`**

```tsx
import React from "react";
import { Helmet } from "react-helmet";

interface Props {
  name?: string;
  description?: string;
  lang?: string;
}

function AppViewerHtmlTitle(props: Props) {
  const { description, lang, name } = props;

  if (!name) return null;

  const htmlAttributes: Record<string, string> = {};
  if (lang) {
    htmlAttributes.lang = lang;
  }

  return (
    <Helmet htmlAttributes={htmlAttributes}>
      <title>{name}</title>
      {description && <meta content={description} name="description" />}
    </Helmet>
  );
}

export default AppViewerHtmlTitle;
```

**Step 2: Pass `lang` from the App Viewer**

In `app/client/src/pages/AppViewer/index.tsx`, around line 264, update the `HtmlTitle` usage:

```tsx
<HtmlTitle
  description={pageDescription}
  lang={currentApplicationDetails?.applicationDetail?.htmlLang}
  name={currentApplicationDetails?.name}
/>
```

This requires importing or accessing `currentApplicationDetails` which is already available in scope (used for `.name`).

**Step 3: Verify**

In the running app, set `htmlLang` to `de` in App Settings, then open the published app. Inspect `<html>` in DevTools and confirm `lang="de"`.

**Step 4: Commit**

```bash
git add app/client/src/pages/AppViewer/AppViewerHtmlTitle.tsx app/client/src/pages/AppViewer/index.tsx
git commit -m "feat: apply htmlLang to published app HTML via react-helmet"
```

---

### Task 7: Also apply `htmlLang` in the editor preview (Helmet in PageWrapper)

**Files:**
- Modify: `app/client/src/pages/common/PageWrapper.tsx`

**Step 1: Check if this is needed**

The editor itself uses `PageWrapper` which also uses `<Helmet>`. For consistency, if the user is previewing the app in-editor, the lang should reflect their setting too.

In `PageWrapper.tsx`, add `htmlAttributes` to the existing `<Helmet>`:

```tsx
<Helmet htmlAttributes={lang ? { lang } : undefined}>
  <title>{pageTitle}</title>
</Helmet>
```

However, in the editor context the `lang` value may not be readily available without additional selector wiring. **This is optional and lower priority** — the primary user-facing issue is the published/deployed app viewer (Task 6). Skip this task if it adds complexity; the editor shell can remain `lang="en"` since it is not what end-users see.

**Decision:** Mark as optional. Proceed only if straightforward.

---

## Phase 4 — Instance-Level Default

### Task 8: Add `APPSMITH_DEFAULT_HTML_LANG` env var support

**Files:**
- Modify: `app/client/public/index.html`
- Modify: `deploy/docker/fs/opt/appsmith/caddy-reconfigure.mjs` (template processing already handles `APPSMITH_*` vars)
- Modify: `app/client/src/pages/AppViewer/AppViewerHtmlTitle.tsx`

**Step 1: Add the env var placeholder to index.html**

In the `<script>` block that parses configs (around line 41 of index.html), add:

```javascript
const DEFAULT_HTML_LANG = parseConfig('{{env "APPSMITH_DEFAULT_HTML_LANG"}}');
```

Then in `window.APPSMITH_FEATURE_CONFIGS` (around line 225), add:

```javascript
defaultHtmlLang: DEFAULT_HTML_LANG || "en",
```

**Step 2: Read it in the client config**

In the Appsmith configs reader (find via `getAppsmithConfigs`), ensure `defaultHtmlLang` is exposed.

Find the file:

```
app/client/src/ce/configs/index.ts
```

Add `defaultHtmlLang` to the returned config object.

**Step 3: Use the fallback in AppViewerHtmlTitle**

Update `AppViewerHtmlTitle.tsx` to accept a fallback:

```tsx
import { getAppsmithConfigs } from "ee/configs";

const { defaultHtmlLang } = getAppsmithConfigs();

function AppViewerHtmlTitle(props: Props) {
  const { description, lang, name } = props;

  if (!name) return null;

  const effectiveLang = lang || defaultHtmlLang || "en";

  return (
    <Helmet htmlAttributes={{ lang: effectiveLang }}>
      <title>{name}</title>
      {description && <meta content={description} name="description" />}
    </Helmet>
  );
}
```

**Step 4: Also update the static index.html lang attribute**

Change the static `<html lang="en">` to use the env var at build time. In `caddy-reconfigure.mjs`, the `finalizeHtmlFiles()` function already replaces `{{env "APPSMITH_*"}}`. So change index.html:

```html
<html lang="{{env "APPSMITH_DEFAULT_HTML_LANG"}}" translate="no">
```

And update `caddy-reconfigure.mjs`'s `extraEnv` to include a fallback:

```javascript
APPSMITH_DEFAULT_HTML_LANG: process.env.APPSMITH_DEFAULT_HTML_LANG || "en",
```

This ensures the static HTML always has a valid lang even before React hydrates.

**Step 5: Verify**

Set `APPSMITH_DEFAULT_HTML_LANG=de` in `.env`, restart, and confirm:
- The raw HTML source has `<html lang="de">`.
- A published app with no per-app `htmlLang` set shows `lang="de"`.
- A published app with `htmlLang: "fr"` set shows `lang="fr"` (per-app overrides instance).

**Step 6: Commit**

```bash
git add app/client/public/index.html deploy/docker/fs/opt/appsmith/caddy-reconfigure.mjs \
  app/client/src/pages/AppViewer/AppViewerHtmlTitle.tsx app/client/src/ce/configs/index.ts
git commit -m "feat: add APPSMITH_DEFAULT_HTML_LANG env var with per-app override"
```

---

## Phase 5 — Additional Hardening

### Task 9: Add `translate="no"` to editor-only UI containers

**Files:**
- Modify: `app/client/src/pages/Editor/PropertyPane/PropertyPaneTab.tsx`
- Modify: `app/client/src/pages/AppIDE/components/AppSettings/AppSettings.tsx`

**Step 1: Add `translate="no"` to the PropertyPaneTab wrapper**

This prevents browser translation from corrupting the "Content" / "Style" tab labels (the exact bug reported in the issue comments).

In `PropertyPaneTab.tsx`, add the attribute to `StyledTabs`:

```tsx
<StyledTabs onValueChange={onValueChange} translate="no" value={tabs[selectedIndex]}>
```

**Step 2: Add `translate="no"` to the AppSettings wrapper**

In `AppSettings.tsx`, add to the outer `<Wrapper>`:

```tsx
<Wrapper className="flex flex-row" translate="no">
```

**Step 3: Verify**

Open the editor with Chrome translate enabled. Confirm "Content" tab no longer gets translated to "Thrilled" or similar.

**Step 4: Commit**

```bash
git add app/client/src/pages/Editor/PropertyPane/PropertyPaneTab.tsx \
  app/client/src/pages/AppIDE/components/AppSettings/AppSettings.tsx
git commit -m "fix: protect editor UI labels from browser auto-translation"
```

---

### Task 10: Add `translate="no"` to Custom Widget and Iframe Widget inner HTML templates

**Files:**
- Modify: `app/client/src/widgets/CustomWidget/component/index.tsx:216`
- Modify: `app/client/src/widgets/wds/WDSCustomWidget/component/createHtmlTemplate.ts:19`
- Modify: `app/client/src/widgets/ExternalWidget/component/index.tsx:89`

**Step 1: Update Custom Widget srcDoc template**

Change `<html>` to `<html translate="no">` in the srcDoc string (line 216).

**Step 2: Update WDS Custom Widget template**

Change `<html>` to `<html translate="no">` in `createHtmlTemplate` (line 19).

**Step 3: Update External Widget template**

Change `<html>` to `<html translate="no">` in ExternalWidget srcDoc (line 89).

**Step 4: Commit**

```bash
git add app/client/src/widgets/CustomWidget/component/index.tsx \
  app/client/src/widgets/wds/WDSCustomWidget/component/createHtmlTemplate.ts \
  app/client/src/widgets/ExternalWidget/component/index.tsx
git commit -m "fix: add translate=no to widget iframe HTML templates"
```

---

## Summary of Changes

| Phase | What | Risk | Files |
|-------|------|------|-------|
| 1 | Add notranslate meta + attribute | Very low | `index.html`, `404.html`, `loading.html` |
| 2 | Server: `htmlLang` field on `ApplicationDetailCE` | Low | `ApplicationDetailCE.java` |
| 3 | Client: types, General Settings UI, Helmet integration | Medium | `types.ts`, `ApplicationApi.tsx`, `GeneralSettings.tsx`, `AppViewerHtmlTitle.tsx`, `AppViewer/index.tsx` |
| 4 | Instance-level `APPSMITH_DEFAULT_HTML_LANG` env var | Low | `index.html`, `caddy-reconfigure.mjs`, `configs/index.ts`, `AppViewerHtmlTitle.tsx` |
| 5 | Harden editor UI + widget iframes | Very low | `PropertyPaneTab.tsx`, `AppSettings.tsx`, 3 widget files |

## Execution Order

Phases are independent and can be parallelized, but the recommended order is:

1. **Phase 1** first — immediate relief, zero risk, no API changes.
2. **Phase 5** next — further immediate relief, also zero API changes.
3. **Phase 2 → Phase 3** — the main feature (server then client).
4. **Phase 4** last — builds on Phase 3.

## Testing Checklist

- [ ] Chrome auto-translate prompt no longer appears on Appsmith pages (Phase 1)
- [ ] Editor "Content" tab label is not corrupted by translate extensions (Phase 5)
- [ ] Setting `htmlLang: "de"` in App Settings persists after save and page reload
- [ ] Published app shows `<html lang="de">` in DOM when `htmlLang` is set to `de`
- [ ] Published app shows `<html lang="en">` when no `htmlLang` is set and no env var
- [ ] `APPSMITH_DEFAULT_HTML_LANG=fr` causes published apps to default to `lang="fr"`
- [ ] Per-app `htmlLang` overrides the instance default
- [ ] Existing apps without `htmlLang` set continue to work with `lang="en"`
- [ ] Git import/export preserves the `htmlLang` field (it's on `ApplicationDetailCE` which is already git-serialized)
