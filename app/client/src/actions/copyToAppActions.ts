import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  CopyEntityToAppPayload,
  CopyToAppModalEntity,
} from "pages/Editor/Explorer/CopyToApp/types";

export const openCopyToAppModal = (payload: CopyToAppModalEntity) => ({
  type: ReduxActionTypes.OPEN_COPY_ENTITY_TO_APP_MODAL,
  payload,
});

export const closeCopyToAppModal = () => ({
  type: ReduxActionTypes.CLOSE_COPY_ENTITY_TO_APP_MODAL,
});

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

export const fetchPagesForCopyTarget = (applicationId: string) => ({
  type: ReduxActionTypes.FETCH_COPY_TARGET_PAGES_INIT,
  payload: { applicationId },
});
