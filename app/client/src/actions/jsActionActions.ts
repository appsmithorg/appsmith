import {
  ReduxActionTypes,
  ReduxAction,
  EvaluationReduxAction,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { JSCollection } from "entities/JSCollection";
import { CreateJSCollectionRequest } from "api/JSActionAPI";

export type FetchJSCollectionsPayload = {
  applicationId: string;
};

export const fetchJSCollections = ({
  applicationId,
}: {
  applicationId: string;
}): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_JS_ACTIONS_INIT,
    payload: { applicationId },
  };
};

export const createJSCollectionRequest = (
  payload: CreateJSCollectionRequest,
) => {
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

export const copyJSCollectionError = (payload: {
  id: string;
  destinationPageId: string;
}) => {
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

export const moveJSCollectionError = (payload: {
  id: string;
  originalPageId: string;
}) => {
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
}: {
  applicationId: string;
}): ReduxAction<FetchJSCollectionsPayload> => {
  return {
    type: ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_INIT,
    payload: { applicationId },
  };
};

export default {
  fetchJSCollections,
  deleteJSCollection,
  deleteJSCollectionSuccess,
};
