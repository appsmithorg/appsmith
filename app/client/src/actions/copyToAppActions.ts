import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { CopyEntityToAppPayload } from "pages/Editor/Explorer/CopyToApp/types";

export const copyActionToApp = (payload: CopyEntityToAppPayload) => ({
  type: ReduxActionTypes.COPY_ACTION_TO_APP_INIT,
  payload,
});

export const copyJSActionToApp = (payload: CopyEntityToAppPayload) => ({
  type: ReduxActionTypes.COPY_JS_ACTION_TO_APP_INIT,
  payload,
});

export const fetchAppsForCopyTarget = (workspaceId: string) => ({
  type: ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_INIT,
  payload: { workspaceId },
});
