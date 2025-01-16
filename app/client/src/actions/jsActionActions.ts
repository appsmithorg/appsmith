import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { ReduxAction } from "./ReduxActionTypes";
import type { JSCollection } from "entities/JSCollection";
import type { CreateJSCollectionRequest } from "ee/api/JSActionAPI";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import type { ApiResponse } from "api/ApiResponses";
import type { ErrorActionPayload } from "../sagas/ErrorSagas";
import type { EvaluationReduxAction } from "./EvaluationReduxActionTypes";

export interface FetchJSCollectionsPayload {
  applicationId: string;
  publishedActionCollections?: ApiResponse<JSCollection[]>;
}

export const fetchJSCollections = ({
  applicationId,
  unpublishedActionCollections,
}: {
  applicationId: string;
  unpublishedActionCollections?: ApiResponse<JSCollection[]>;
}): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_JS_ACTIONS_INIT,
    payload: { applicationId, unpublishedActionCollections },
  };
};

export const createJSCollectionRequest = (payload: {
  request: CreateJSCollectionRequest;
  from: EventLocation;
}) => {
  return {
    type: ReduxActionTypes.CREATE_JS_ACTION_INIT,
    payload,
  };
};

export const createJSCollectionSuccess = (payload: JSCollection) => {
  return {
    type: ReduxActionTypes.CREATE_JS_ACTION_SUCCESS,
    payload,
  };
};

export const copyJSCollectionRequest = (payload: {
  id: string;
  destinationPageId: string;
  name: string;
}) => {
  return {
    type: ReduxActionTypes.COPY_JS_ACTION_INIT,
    payload,
  };
};

export const copyJSCollectionSuccess = (payload: JSCollection) => {
  return {
    type: ReduxActionTypes.COPY_JS_ACTION_SUCCESS,
    payload,
  };
};

export const copyJSCollectionError = (
  payload: {
    id: string;
    destinationPageId: string;
  } & ErrorActionPayload,
) => {
  return {
    type: ReduxActionErrorTypes.COPY_JS_ACTION_ERROR,
    payload,
  };
};

export const moveJSCollectionRequest = (payload: {
  id: string;
  destinationPageId: string;
  name: string;
}) => {
  return {
    type: ReduxActionTypes.MOVE_JS_ACTION_INIT,
    payload,
  };
};

export const moveJSCollectionSuccess = (payload: JSCollection) => {
  return {
    type: ReduxActionTypes.MOVE_JS_ACTION_SUCCESS,
    payload,
  };
};

export const moveJSCollectionError = (
  payload: {
    id: string;
    originalPageId: string;
  } & ErrorActionPayload,
) => {
  return {
    type: ReduxActionErrorTypes.MOVE_JS_ACTION_ERROR,
    payload,
  };
};

export const deleteJSCollection = (payload: { id: string; name: string }) => {
  return {
    type: ReduxActionTypes.DELETE_JS_ACTION_INIT,
    payload,
  };
};

export const deleteJSCollectionSuccess = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.DELETE_JS_ACTION_SUCCESS,
    payload,
  };
};

export const deleteJSCollectionError = (payload: { id: string }) => {
  return {
    type: ReduxActionErrorTypes.DELETE_JS_ACTION_ERROR,
    payload,
  };
};

export const saveJSObjectName = (payload: { id: string; name: string }) => ({
  type: ReduxActionTypes.SAVE_JS_COLLECTION_NAME_INIT,
  payload: payload,
});

export const fetchJSCollectionsForPage = (pageId: string) => {
  return {
    type: ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_INIT,
    payload: { pageId },
  };
};

export const fetchJSCollectionsForPageSuccess = (actions: JSCollection[]) => {
  return {
    type: ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS,
    payload: actions,
  };
};

export const fetchJSCollectionsForPageError = () => {
  return {
    type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_FOR_PAGE_ERROR,
  };
};

export const fetchJSCollectionsForView = ({
  applicationId,
  publishedActionCollections,
}: {
  applicationId: string;
  publishedActionCollections?: ApiResponse<JSCollection[]>;
}): ReduxAction<FetchJSCollectionsPayload> => {
  return {
    type: ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_INIT,
    payload: { applicationId, publishedActionCollections },
  };
};

export const closeJSActionTab = (payload: { id: string; parentId: string }) => {
  return {
    type: ReduxActionTypes.CLOSE_JS_ACTION_TAB,
    payload,
  };
};
export const closeJsActionTabSuccess = (payload: {
  id: string;
  parentId: string;
}) => {
  return {
    type: ReduxActionTypes.CLOSE_JS_ACTION_TAB_SUCCESS,
    payload,
  };
};

export default {
  fetchJSCollections,
  deleteJSCollection,
  deleteJSCollectionSuccess,
};
