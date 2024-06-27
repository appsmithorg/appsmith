import type {
  BufferedReduxAction,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { JS_ACTIONS } from "@appsmith/actions/evaluationActionsList";
import type { AffectedJSObjects } from "sagas/EvaluationsSagaUtils";
import type { JSCollection } from "entities/JSCollection";

export function getAffectedJSObjectIdsFromJSAction(
  action: ReduxAction<unknown> | BufferedReduxAction<unknown>,
): AffectedJSObjects {
  // This is triggered during a page load and at that point of time we need to send all JSObjects
  if (action.type === ReduxActionTypes.FETCH_ALL_PAGE_ENTITY_COMPLETION) {
    return {
      ids: [],
      isAllAffected: true,
    };
  }

  if (!JS_ACTIONS.includes(action.type)) {
    return {
      ids: [],
      isAllAffected: false,
    };
  }
  // only JS actions here
  action as ReduxAction<unknown>;

  if (
    // When fetching JSActions fails, we need to diff all JSObjects because the reducer updates it
    // to empty collection
    action.type === ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR ||
    action.type === ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR ||
    // for these two actions, we need to diff all JSObjects because the reducer updates allNodes
    action.type === ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS ||
    action.type === ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS ||
    action.type === ReduxActionTypes.DELETE_JS_ACTION_SUCCESS
  ) {
    return {
      isAllAffected: true,
      ids: [],
    };
  }

  const { payload } = action as ReduxAction<{
    data: JSCollection;
  }> &
    ReduxAction<JSCollection>;
  // some actions have within data property of the action payload, we need to extract it from there
  const innerData = payload?.data || payload;

  const ids = Array.isArray(innerData)
    ? innerData.map(({ id }) => id)
    : [innerData.id];

  return { ids, isAllAffected: false };
}

function getAffectedJSObjectIdsFromBufferedAction(
  action: ReduxAction<unknown> | BufferedReduxAction<unknown>,
): AffectedJSObjects {
  if (action.type !== ReduxActionTypes.BUFFERED_ACTION) {
    return {
      ids: [],
      isAllAffected: false,
    };
  }
  // only Buffered actions here
  return (
    (action as BufferedReduxAction<unknown>).affectedJSObjects || {
      ids: [],
      isAllAffected: false,
    }
  );
}

export const AFFECTED_JS_OBJECTS_FNS = [
  getAffectedJSObjectIdsFromJSAction,
  getAffectedJSObjectIdsFromBufferedAction,
];
