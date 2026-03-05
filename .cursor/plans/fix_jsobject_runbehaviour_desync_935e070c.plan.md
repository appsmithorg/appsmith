---
name: Fix JSObject runBehaviour desync
overview: Fix the bug where editing a JSObject body causes function run settings (On page load / Manual) to desync between the UI and server, by making the body-update endpoint return the full collection and having the client use that response.
todos:
  - id: server-return-type
    content: Change `updateUnpublishedActionCollectionBody` in LayoutCollectionServiceCEImpl.java to return `Mono<ActionCollectionDTO>` with populated actions instead of `Mono<Integer>`
    status: pending
  - id: server-interface
    content: Update `LayoutCollectionServiceCE` interface to match new return type
    status: pending
  - id: server-controller
    content: Change controller response type from `ResponseDTO<Integer>` to `ResponseDTO<ActionCollectionDTO>` in ActionCollectionControllerCE.java
    status: pending
  - id: client-saga
    content: Update `handleUpdateJSCollectionBody` in JSPaneSagas.ts to use server response data instead of stale local state, and remove direct Redux state mutation
    status: pending
  - id: client-verify-reducer
    content: Verify jsActionsReducer.tsx UPDATE_JS_ACTION_BODY_SUCCESS handler works correctly with server-sourced data
    status: pending
  - id: client-verify-eval
    content: Verify evaluation worker utils.ts runBehaviour fallback no longer triggers incorrectly
    status: pending
  - id: testing
    content: "Test the fix: set function to On page load, edit body, verify setting persists through save and page refresh"
    status: pending
isProject: false
---

# Fix JSObject runBehaviour Desync on Body Edit

## Problem

When a user edits a JSObject body, the `PUT /v1/collections/actions/{id}/body` endpoint:

1. Only updates the `body` field in the DB
2. Returns `Mono<Integer>` (row count), not the updated collection
3. Does not trigger layout/on-load recalculation

The client saga then fabricates an "updated" collection from stale Redux state and replaces the entire config in the reducer, silently overwriting any server-side `runBehaviour` changes.

## Root Cause Files

- **Server endpoint:** [LayoutCollectionServiceCEImpl.java](app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/LayoutCollectionServiceCEImpl.java) lines 276-304
- **Server controller:** [ActionCollectionControllerCE.java](app/server/appsmith-server/src/main/java/com/appsmith/server/controllers/ce/ActionCollectionControllerCE.java) lines 118-126
- **Client saga:** [JSPaneSagas.ts](app/client/src/sagas/JSPaneSagas.ts) lines 665-720
- **Client reducer:** [jsActionsReducer.tsx](app/client/src/ce/reducers/entityReducers/jsActionsReducer.tsx) lines 119-141
- **Client API:** [JSActionAPI.tsx](app/client/src/ce/api/JSActionAPI.tsx) lines 125-132
- **Eval fallback:** [utils.ts](app/client/src/workers/Evaluation/JSObject/utils.ts) lines 93-101

## Fix Strategy

Return the full `ActionCollectionDTO` (with populated actions) from the body-update endpoint, and use that response on the client instead of echoing back stale local state.

---

## Step 1: Server -- Change `updateUnpublishedActionCollectionBody` return type

**File:** `LayoutCollectionServiceCEImpl.java` (lines 276-304)

- Change the return type from `Mono<Integer>` to `Mono<ActionCollectionDTO>`
- After the DB update, fetch the full `ActionCollection` with populated transient fields (actions, permissions)
- Return the `unpublishedCollection` DTO with its actions (including their `runBehaviour` and `userSetOnLoad`)

Current:

```java
return actionCollectionRepository.updateByIdWithoutPermissionCheck(
    dbActionCollection.getId(), updateObj);
```

Change to something like:

```java
return actionCollectionRepository
    .updateByIdWithoutPermissionCheck(dbActionCollection.getId(), updateObj)
    .then(actionCollectionService.findById(id, actionPermission.getEditPermission()))
    .flatMap(actionCollection -> actionCollectionService
        .generateActionCollectionByViewMode(actionCollection, false))
    .map(actionCollectionDTO -> {
        actionCollectionDTO.setBody(actionCollectionDTO.getBody());
        return actionCollectionDTO;
    });
```

Also update the interface `LayoutCollectionServiceCE` to match the new return type.

---

## Step 2: Server -- Update controller response type

**File:** `ActionCollectionControllerCE.java` (lines 118-126)

Change:

```java
public Mono<ResponseDTO<Integer>> updateActionCollectionBody(...)
```

To:

```java
public Mono<ResponseDTO<ActionCollectionDTO>> updateActionCollectionBody(...)
```

---

## Step 3: Client -- Fix the API return type

**File:** `JSActionAPI.tsx` (lines 125-132)

The return type is already declared as `Promise<AxiosPromise<JSCollectionCreateUpdateResponse>>` (which is `ApiResponse<JSCollection>`). This is actually correct for the new server response. No change needed here, but verify the type mapping between server `ActionCollectionDTO` and client `JSCollection`.

---

## Step 4: Client -- Use server response in the saga

**File:** `JSPaneSagas.ts` (lines 665-720)

This is the most critical change. Currently the saga ignores the server response and constructs `updatedJSCollection` from stale local state:

```typescript
const updatedJSCollection: JSCollection = {
  ...jsCollection,
  isMainJSCollection: !!jsCollection.isMainJSCollection,
};
```

Change to use the server response, merging in any client-only fields:

```typescript
if (isValidResponse) {
  const serverData = response.data as JSCollection;
  const updatedJSCollection: JSCollection = {
    ...serverData,
    isMainJSCollection: !!jsCollection.isMainJSCollection,
  };

  yield put(
    updateJSCollectionBodySuccess({
      data: updatedJSCollection,
    }),
  );
}
```

This ensures `actions[].runBehaviour`, `actions[].executeOnLoad`, and `actions[].userSetOnLoad` all come from the server (source of truth) rather than stale client state.

Also remove the direct mutation on line 674:

```typescript
jsCollection["body"] = actionPayload.payload.body;
```

This mutates Redux state directly, which is a Redux anti-pattern. The body is already updated optimistically via the `UPDATE_JS_ACTION_BODY_INIT` reducer handler.

---

## Step 5: Client -- Verify reducer handles server data correctly

**File:** `jsActionsReducer.tsx` (lines 119-141)

The `UPDATE_JS_ACTION_BODY_SUCCESS` handler already replaces the entire `config` with `action.payload.data`. Once the saga passes server data instead of stale local data, this handler will correctly update Redux with the server's truth. No changes expected here, but verify during testing.

---

## Step 6: Verify evaluation worker fallback

**File:** `utils.ts` (lines 93-101)

The fallback `ActionRunBehaviour.MANUAL` should now be less likely to trigger because the Redux state (and thus `jsEntityConfig.meta`) will have the correct `runBehaviour` from the server. No code change needed, but verify in testing that the eval config picks up the correct value after a body edit.

---

## Testing Plan

- Set a JS function to "On page load" via the settings gear
- Edit the JSObject body (add a comment, rename a variable, etc.)
- Verify the settings panel still shows "On page load"
- Refresh the page and verify the function actually runs on page load
- Check Redux DevTools to confirm `actions[].runBehaviour` matches the server after a body save
- Test with `userSetOnLoad = true` (user-toggled) and `userSetOnLoad = false` (auto-detected) functions
- Test renaming a function in the body and verify settings are preserved for unchanged functions

