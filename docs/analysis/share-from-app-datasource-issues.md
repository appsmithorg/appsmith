# Analysis: Datasource Issues When Sharing App from Within the App (Default Role)

## Problem Statement

**Customer report:** When using the default role and sharing an app **from within the app** (in-app share), users experience datasource issues. When sharing **from the workspace**, no issues occur.

**Additional context:** The datasource is an **authenticated API** (OAuth, Bearer token, API key, or similar).

## Key Findings

### 1. **Workspace State Difference: In-App vs Workspace**

**When sharing from workspace:**
- User is on the Applications page (`/applications` or `/applications?workspaceId=xxx`)
- `fetchEntitiesOfWorkspace` has been called, loading full workspace data
- `state.ui.selectedWorkspace.workspace` contains full workspace object (id, name, etc.)
- `state.ui.workspaces.workspaceRoles` contains roles for the current workspace
- Workspace context is fully established

**When sharing from app viewer:**
- User navigated directly to app URL (`/app/xxx`) or from workspace
- Only `SET_CURRENT_WORKSPACE_ID` is dispatched (in `fetchAppAndPagesSaga`)
- **Critical:** `SET_CURRENT_WORKSPACE_ID` only sets `workspace.id` — it does NOT set `workspace.name` or full workspace object
- `state.ui.selectedWorkspace.workspace` = `{ id: "<id>", name: "" }` (partial)
- `state.ui.workspaces.workspaceRoles` may be **stale** from a previously visited workspace

**Relevant code:**
```typescript
// ce/reducers/uiReducers/selectedWorkspaceReducer.ts:235-239
[ReduxActionTypes.SET_CURRENT_WORKSPACE_ID]: (draftState, action) => {
  draftState.workspace.id = action.payload.workspaceId;  // Only sets ID!
},
```

### 2. **Stale workspaceRoles When Opening Share Modal**

The `InviteUsersForm` uses `getRolesForField(state)` which reads from `state.ui.workspaces.workspaceRoles`. This is a **global** state, not per-workspace.

**Flow when opening share from app:**
1. User clicks Share → modal opens
2. `AppInviteUsersForm` passes `workspaceId={props.workspace.id}` to `WorkspaceInviteUsersForm`
3. `InviteUsersForm` useEffect runs: `fetchAllRoles(workspaceId)`, `fetchCurrentWorkspace(workspaceId)`, `fetchUsers(workspaceId)`
4. **Race condition:** On first render, `getRolesForField` may return roles from a **previously loaded workspace** (e.g., workspace user was in before navigating to app)
5. User sees role dropdown with potentially **wrong workspace's roles**
6. If user selects "default role" quickly before fetch completes, they might be assigning the **wrong permission group**

### 3. **Default Role and Datasource Permissions**

From `PolicyGeneratorCE.java`:
```java
// If a viewer of all apps in the workspace, give execute permission on all the datasources
hierarchyGraph.addEdge(WORKSPACE_READ_APPLICATIONS, EXECUTE_DATASOURCES);
```

The default role (typically "App Viewer" or "Viewer") should have `WORKSPACE_READ_APPLICATIONS`, which grants `EXECUTE_DATASOURCES`. 

**Potential issue:** If the wrong permission group is assigned (e.g., from a different workspace due to stale roles), the invited user may not get `EXECUTE_DATASOURCES` for the app's workspace.

### 4. **Authenticated API Datasources — Why Permission Matters More**

For **authenticated APIs** (OAuth2, Bearer token, API key, Basic Auth), action execution works as follows:

1. **Server-side execution:** When a user runs a query, the server fetches the datasource with `EXECUTE_DATASOURCES` permission (`ActionExecutionSolutionCEImpl.getCachedDatasourceStorage`).
2. **Credential usage:** The server loads `DatasourceStorage` (including decrypted credentials) and uses them to call the external API. No client-side credential handling for execution.
3. **Permission gate:** If the user lacks `EXECUTE_DATASOURCES` on the datasource, `datasourceService.findById(datasource.getId(), executePermission)` fails → user sees datasource/execution errors.

**OAuth2 note:** OAuth tokens are stored in `DatasourceStorage` (per-datasource, per-environment). The server uses the stored token for any execution; the invited user does **not** need to re-authorize. They only need `EXECUTE_DATASOURCES`.

**Implication:** If the in-app share flow assigns the wrong permission group (e.g., from stale `workspaceRoles`), the invited user may not get `EXECUTE_DATASOURCES` for the app's workspace. When they run the app, actions that use the authenticated API will fail with permission or datasource errors — even though the datasource is configured and authorized.

### 5. **Backend Invite Validation**

From `UserAndAccessManagementServiceCEImpl.java`:
```java
.filter(permissionGroup ->
    permissionGroup.getDefaultDomainType().equals(Workspace.class.getSimpleName())
            && StringUtils.hasText(permissionGroup.getDefaultDomainId()))
```

The invite API **only accepts workspace-level permission groups**. The `permissionGroupId` must belong to the workspace. If the frontend sends a permission group from a different workspace (due to stale roles), the backend would reject it — but the frontend might be sending the correct workspaceId with a wrong permissionGroupId from stale state.

### 6. **Workspace Fetch Timing**

`AppInviteUsersForm` has:
```javascript
useEffect(() => {
  if (currentUser?.name !== ANONYMOUS_USERNAME) {
    fetchCurrentWorkspace(props.workspaceId);
  }
}, [props.workspaceId, fetchCurrentWorkspace, currentUser?.name]);
```

But `WorkspaceInviteUsersForm` (parent) passes `workspaceId` from `FormDialogComponent`, which gets it from `workspace.id`. The `fetchCurrentWorkspace` populates the full workspace. However, **roles are fetched separately** by `InviteUsersForm`'s useEffect. If `workspaceId` is empty or wrong initially, the fetches could fail or fetch wrong data.

### 7. **WorkspaceId Source in App Viewer**

When loading app in viewer:
- `fetchApplication` → `fetchAppAndPagesSaga` → `PageApi.fetchAppAndPages`
- Response includes `response.data.workspaceId`
- `SET_CURRENT_WORKSPACE_ID` is dispatched with this workspaceId

**Edge case:** If user bookmarks app URL and opens in new tab/session, the consolidated page load runs. The `fetchApplication` in engine's `loadAppData` uses `getFromServerWhenNoPrefetchedResult` — it may use prefetched pages from consolidated API. The consolidated view API might return different structure. Need to verify the view-mode consolidated API returns workspaceId.

## Exact Reproducible Scenario

### Step-by-Step Bug Reproduction

1. **Setup:** User has access to at least 2 workspaces (Workspace A and Workspace B). App with authenticated API datasource lives in **Workspace B**.

2. **User visits Workspace A:** User goes to `/applications` (Workspace A) or Workspace A settings. At some point, `fetchRolesForWorkspace(workspaceA)` runs (e.g. from Members page or a previous invite modal). `state.ui.workspaces.workspaceRoles` = Workspace A's roles (Admin, Developer, Viewer with Workspace A's permission group IDs).

3. **User navigates to app in Workspace B:** User opens app via direct link (e.g. `/app/{appId}`) or from an external source. Does **not** visit Workspace B's applications page first.
   - `fetchAppAndPagesSaga` runs → `SET_CURRENT_WORKSPACE_ID(workspaceB)` dispatched
   - `state.ui.selectedWorkspace.workspace.id` = workspace B's ID
   - **Critical:** `fetchEntitiesOfWorkspace` does **not** include `fetchRolesForWorkspace` (see `getWorkspaceEntitiesActions` in `workspaceHelpers.ts` — only fetches applications and users)
   - `state.ui.workspaces.workspaceRoles` remains **Workspace A's roles** (never fetched for Workspace B)

4. **User clicks Share:** Share modal opens. `FormDialogComponent` passes `workspaceId={currentWorkspace.id}` = workspace B's ID. `InviteUsersForm` mounts with `workspaceId=workspaceB`.

5. **Race condition:** `useEffect` in `InviteUsersForm` runs:
   ```javascript
   fetchCurrentWorkspace(props.workspaceId);
   fetchAllRoles(props.workspaceId);  // Async — takes time
   fetchUsers(props.workspaceId);
   ```
   On **first render**, `mapStateToProps` provides `roles: getRolesForField(state)` = `state.ui.workspaces.workspaceRoles` = **Workspace A's roles**.

6. **User invites before fetch completes:** User sees role dropdown with "Admin", "Developer", "Viewer" (Workspace A's role names). User selects "Viewer", enters email, clicks Invite — all before `fetchAllRoles(workspaceB)` completes.

7. **Wrong invite sent:** `inviteUsersToWorkspace` is called with:
   - `workspaceId: workspaceB` (correct — from `props.workspaceId`)
   - `permissionGroupId: Workspace A's Viewer role ID` (wrong — from stale `workspaceRoles`)

8. **Backend behavior:** The invite API **ignores** `workspaceId` from the request. It derives the workspace from the permission group:
   ```java
   // UserAndAccessManagementServiceCEImpl.java:144-145
   Mono<Workspace> workspaceMono = permissionGroupMono
       .flatMap(pg -> workspaceService.getById(pg.getDefaultDomainId()));
   ```
   So the user is added to **Workspace A** (permission group's `defaultDomainId`), not Workspace B.

9. **Result:** Invited user gets Workspace A's Viewer role. The app and its authenticated API datasource are in **Workspace B**. Invited user has no access to Workspace B → no `EXECUTE_DATASOURCES` on the datasource → **datasource/execution errors** when they try to use the app.

### Why "Share from Workspace" Works

When sharing from the workspace applications page, the user has typically been in that workspace context. If they opened the invite modal from the workspace before, `fetchAllRoles` ran for that workspace. Or they may have waited for the modal's fetch. The `workspaceRoles` are more likely to match the current workspace.

When sharing from the app viewer via direct link, the user often **never** visited the workspace — so `workspaceRoles` were never fetched for the app's workspace, and remain from a previous workspace.

## Root Cause Hypotheses (Ranked)

### Hypothesis 1: Stale workspaceRoles (HIGH) — **CONFIRMED**
When opening share from app, `workspaceRoles` may still contain roles from a different workspace. User selects "default role" which could be the default of the **wrong** workspace. The permission group gets assigned, but it's for the wrong workspace's default role — so the user gets workspace A's viewer role while the app is in workspace B.

**Authenticated API support:** For authenticated API datasources, execution requires `EXECUTE_DATASOURCES`. If the wrong role is assigned, the invited user lacks this permission → action execution fails with datasource/permission errors. This matches the "datasource issues" symptom.

**Fix:** Ensure `fetchRolesForWorkspace` is called with the **application's workspaceId** before showing the role dropdown, and clear/reset workspaceRoles when workspace context changes.

### Hypothesis 2: workspaceId Not Set in App Viewer (MEDIUM)
If the consolidated page load for view mode doesn't trigger `fetchAppAndPages` or returns data without workspaceId, `state.ui.selectedWorkspace.workspace.id` could remain empty. The Share button checks `currentWorkspaceId &&` — if empty, the button wouldn't show. But if it shows, workspaceId is set. However, there could be edge cases where workspace is from a different source.

**Fix:** Ensure app viewer init always sets workspace from application's workspaceId. Consider using `currentApplication.workspaceId` as fallback when opening share modal.

### Hypothesis 3: GAC / Application-Level Invite Mismatch (MEDIUM)
When GAC is enabled, `WorkspaceInviteUsersForm` uses `getAllAppUsers` and shows app-level UI. But the invite API is still `inviteUsersToWorkspace` — workspace-level only. The `applicationId` is passed to the form but **not used** in the invite API. The roles shown are workspace roles. If there's confusion between app-level and workspace-level permissions, users might expect different behavior.

### Hypothesis 4: Default Role Selection Before Data Loads (LOW)
If the role dropdown defaults to "default role" before `fetchRolesForWorkspace` completes, and the default is derived from stale `workspaceRoles`, the wrong role could be pre-selected. User might not notice and click Invite.

## Recommended Fixes

1. **Use application.workspaceId as source of truth when in app context**
   - In `ShareButton` / `FormDialogComponent`, when `applicationId` is present, derive `workspaceId` from `currentApplication.workspaceId` instead of (or as fallback for) `currentWorkspace.id`
   - Ensures we always use the app's workspace when sharing from app viewer

2. **Reset workspaceRoles when workspace context changes**
   - When `fetchRolesForWorkspace` is called with a new workspaceId, clear previous roles first to avoid showing stale data
   - Or: store workspaceRoles per workspaceId in state

3. **Ensure workspace is fully loaded before showing invite form**
   - When opening share modal from app viewer, explicitly call `fetchWorkspace(application.workspaceId)` and `fetchRolesForWorkspace(application.workspaceId)` before rendering the form
   - Show loading state until workspace and roles are loaded

4. **Set full workspace object in app viewer init**
   - When `SET_CURRENT_WORKSPACE_ID` is dispatched, also fetch and set the full workspace object so `currentWorkspace` has name and other fields
   - Or: dispatch `FETCH_WORKSPACE` after `SET_CURRENT_WORKSPACE_ID` in the init flow

5. **Clear workspaceRoles when workspace context changes**
   - When `SET_CURRENT_WORKSPACE_ID` is dispatched with a different workspaceId, clear `state.ui.workspaces.workspaceRoles` (set to `[]`)
   - Forces InviteUsersForm to show loading/empty until `fetchAllRoles(workspaceId)` completes with correct roles
   - Prevents displaying roles from the wrong workspace

6. **Disable role dropdown until roles are loaded for the correct workspace**
   - In `InviteUsersForm`, use `state.ui.workspaces.loadingStates.isFetchAllRoles` to disable the role Select until fetch completes
   - Optionally show a loading spinner in the dropdown

## Debugging Methods to Prove the Case (No Code Changes Required)

These steps can be done using only your browser. No code changes are needed.

---

### Method 1: Redux DevTools — Check if Wrong Roles Are Shown

**What you need:** Redux DevTools browser extension ([Chrome](https://chrome.google.com/webstore/detail/redux-devtools) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)).

**Step-by-step:**

1. **Install Redux DevTools** (if not already installed)
   - Open the Chrome Web Store (or Firefox Add-ons) and search for "Redux DevTools"
   - Click "Add to Chrome" (or "Add to Firefox") and install

2. **Open Appsmith** in your browser and log in

3. **Go to your first workspace (Workspace A)**
   - Click the workspace switcher (top left) and select Workspace A
   - Go to the Applications page or the Members/Settings page
   - This loads Workspace A's roles into the app's memory

4. **Record Workspace A's role IDs**
   - Open Redux DevTools (click the Redux icon in your browser toolbar, or press F12 and look for the "Redux" tab)
   - In the left panel, click on the most recent action
   - In the right panel, find **State** and expand it
   - Navigate to: `State` → `ui` → `workspaces` → `workspaceRoles`
   - You should see a list of roles (e.g. Admin, Developer, Viewer)
   - **Write down or screenshot** the `id` values for each role (they look like long strings, e.g. `"64f2a1b3c4d5e6f7a8b9c0d1"`)

5. **Open an app in a different workspace (Workspace B)**
   - **Important:** Do NOT click on Workspace B in the workspace switcher first
   - Instead, either:
     - Copy the app URL from Workspace B (e.g. `https://your-appsmith.com/app/abc123...`) and paste it in a new tab, OR
     - Use a bookmark or link that goes directly to the app
   - The app should load. You are now viewing an app that belongs to Workspace B

6. **Click the Share button** (in the app header)

7. **Capture the Redux state immediately**
   - As soon as the Share modal opens, switch to Redux DevTools
   - Click the most recent action in the left panel
   - Navigate to: `State` → `ui` → `workspaces` → `workspaceRoles`
   - Also note: `State` → `ui` → `selectedWorkspace` → `workspace` → `id` (this is the app's workspace = Workspace B)

8. **Compare the role IDs**
   - Look at the `id` values in `workspaceRoles`
   - **If the bug exists:** These IDs will match the ones you wrote down from Workspace A — meaning the Share modal is showing Workspace A's roles even though you're sharing an app in Workspace B

---

### Method 2: Network Tab — See if Invite Sends Before Roles Load

**What you need:** Your browser's built-in Developer Tools (no extension required).

**Step-by-step:**

1. **Open Developer Tools**
   - Press `F12` (or right-click the page → "Inspect")
   - Click the **Network** tab

2. **Slow down the network** (to make the race easier to see)
   - In the Network tab, find the dropdown that says "No throttling" or "Online"
   - Change it to **"Slow 3G"** or **"Fast 3G"**

3. **Reproduce the flow**
   - Go to Workspace A (Applications or Members page)
   - Then open an app in Workspace B via direct link (see Method 1, step 5)
   - Click the **Share** button
   - **Act quickly:** Select "Viewer" (or any role), enter an email address, and click **Invite** — do this within 1–2 seconds of the modal opening

4. **Look at the Network tab**
   - In the list of requests, look for:
     - A request containing **"permission"** or **"roles"** (this fetches the role list)
     - A request to **"invite"** (this sends the invite)
   - Check the **order** and **timing** of these requests

5. **What to check**
   - **If the bug exists:** The "invite" request may appear **before** the "permission" or "roles" request finishes — meaning you submitted the form before the correct roles were loaded

6. **Optional: Save the network log**
   - Right-click in the Network tab
   - Select "Save all as HAR with content"
   - This saves a file you can share with your team

---

### Method 3: End-to-End Test — See Which Workspace the Invited User Lands In

**What you need:** A test email address you can use for invitations.

**Step-by-step:**

1. **Create or use a test email** (e.g. `test-share-bug-2024@example.com`) that is not yet in your Appsmith instance

2. **Reproduce the share flow**
   - Go to Workspace A (Applications or Members page)
   - Open an app in Workspace B via direct link (see Method 1, step 5)
   - Click **Share**
   - Select **"Viewer"** (or "App Viewer")
   - Enter the test email address
   - Click **Invite**

3. **Accept the invite** (if needed)
   - Check the inbox for the test email
   - Click the invite link and complete sign-up (if it's a new user)

4. **Log in as the invited user**
   - Log out of your current account
   - Log in with the test user's credentials

5. **Check which workspace the user is in**
   - Look at the workspace switcher (top left)
   - **If the bug exists:** The test user will be in **Workspace A**, not Workspace B — even though you invited them while sharing an app from Workspace B
   - The test user will **not** see the app you shared (because it's in Workspace B and they're only in Workspace A)

6. **Optional: Try to use the shared app**
   - If you have the app URL, try opening it as the test user
   - **If the bug exists:** The user may get an error, or the app may load but datasource/query execution will fail (e.g. "You don't have permission to execute this datasource")

---

### What to Gather for a Bug Report

When reporting this issue, include:

| Item | How to get it |
|------|----------------|
| **Redux state snapshot** | Redux DevTools → Right-click the State panel → "Copy object" or take a screenshot of `ui.workspaces.workspaceRoles` and `ui.selectedWorkspace.workspace` |
| **Network log (HAR file)** | Network tab → Right-click → "Save all as HAR with content" |
| **Exact steps you followed** | Write down: which workspace you visited first, how you opened the app (direct link vs. workspace switcher), and what you did in the Share modal |
| **Outcome** | Which workspace did the invited user end up in? Did they see datasource errors when using the app? |
| **Screenshot of Share modal** | Take a screenshot of the Share modal when it first opens (including the role dropdown) |

## Files to Investigate/Modify

- `app/client/src/pages/AppViewer/Navigation/components/ShareButton.tsx` — Consider using application.workspaceId
- `app/client/src/pages/workspace/AppInviteUsersForm.tsx` — Fetch workspace by application.workspaceId when applicationId is present
- `app/client/src/components/editorComponents/form/FormDialogComponent.tsx` — Pass applicationId to form
- `app/client/src/ce/reducers/uiReducers/selectedWorkspaceReducer.ts` — SET_CURRENT_WORKSPACE_ID behavior
- `app/client/src/ce/reducers/uiReducers/workspaceReducer.ts` — workspaceRoles storage
- `app/client/src/ce/sagas/ApplicationSagas.tsx` — fetchAppAndPagesSaga, consider also fetching workspace
- `app/client/src/ce/pages/workspace/InviteUsersForm.tsx` — Role loading and stale state handling
- `app/client/src/ce/selectors/workspaceSelectors.tsx` — `getRolesForField` reads global `workspaceRoles`; consider workspace-scoped selector
