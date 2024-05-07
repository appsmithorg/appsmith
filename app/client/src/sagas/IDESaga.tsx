import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import { getJSTabs, getQueryTabs } from "selectors/ideSelectors";
import {
  setIdeEditorViewMode,
  setJSTabs,
  setQueryTabs,
} from "actions/ideActions";
import history from "../utils/history";
import {
  jsCollectionAddURL,
  jsCollectionListURL,
  queryAddURL,
  queryListURL,
} from "@appsmith/RouteBuilder";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { getQueryEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/Query/utils";
import { getJSEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/JS/utils";
import log from "loglevel";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { retrieveIDEViewMode, storeIDEViewMode } from "utils/storage";
import {
  selectJSSegmentEditorTabs,
  selectQuerySegmentEditorTabs,
} from "@appsmith/selectors/appIDESelectors";

export function* updateIDETabsOnRouteChangeSaga(entityInfo: FocusEntityInfo) {
  const { entity, id } = entityInfo;
  if (
    entity === FocusEntity.JS_OBJECT ||
    entity === FocusEntity.JS_MODULE_INSTANCE
  ) {
    const jsTabs: string[] = yield select(getJSTabs);
    const newTabs: string[] = yield call(getUpdatedTabs, id, jsTabs);
    yield put(setJSTabs(newTabs));
  }
  if (
    entity === FocusEntity.QUERY ||
    entity === FocusEntity.QUERY_MODULE_INSTANCE
  ) {
    const queryTabs: string[] = yield select(getQueryTabs);
    const newTabs: string[] = yield call(getUpdatedTabs, id, queryTabs);
    yield put(setQueryTabs(newTabs));
  }
}

function* getUpdatedTabs(newId: string, currentTabs: string[]) {
  if (currentTabs.includes(newId)) return currentTabs;
  const newTabs = [...currentTabs, newId];
  return newTabs;
}

export function* handleJSEntityRedirect(deletedId: string) {
  const pageId: string = yield select(getCurrentPageId);
  const jsTabs: EntityItem[] = yield select(selectJSSegmentEditorTabs);
  const redirectAction = getNextEntityAfterRemove(deletedId, jsTabs);
  switch (redirectAction.action) {
    case RedirectAction.LIST:
      history.push(jsCollectionListURL({ pageId }));
      break;
    case RedirectAction.ITEM:
      if (!redirectAction.payload) {
        log.error("Redirect item does not have a payload");
        history.push(jsCollectionAddURL({ pageId }));
        break;
      }
      const { payload } = redirectAction;
      history.push(getJSEntityItemUrl(payload, pageId));
      break;
  }
}

export function* handleQueryEntityRedirect(deletedId: string) {
  const pageId: string = yield select(getCurrentPageId);
  const queryTabs: EntityItem[] = yield select(selectQuerySegmentEditorTabs);
  const redirectAction = getNextEntityAfterRemove(deletedId, queryTabs);
  switch (redirectAction.action) {
    case RedirectAction.LIST:
      history.push(queryListURL({ pageId }));
      break;
    case RedirectAction.ITEM:
      if (!redirectAction.payload) {
        history.push(queryAddURL({ pageId }));
        log.error("Redirect item does not have a payload");
        break;
      }
      const { payload } = redirectAction;
      history.push(getQueryEntityItemUrl(payload, pageId));
      break;
  }
}

/**
 * Adds custom redirect logic to redirect after an item is deleted
 * 1. Do not navigate if the deleted item is not selected
 * 2. If it was the only item, navigate to the list url, to show the blank state
 * 3. If there are other items, navigate to an item close to the current one
 * **/

export enum RedirectAction {
  NA = "NA", // No action is needed
  LIST = "LIST", // Navigate to a creation URL
  ITEM = "ITEM", // Navigate to this item
}
interface RedirectActionDescription {
  action: RedirectAction;
  payload?: EntityItem;
}

export function getNextEntityAfterRemove(
  removedId: string,
  tabs: EntityItem[],
): RedirectActionDescription {
  const currentSelectedEntity = identifyEntityFromPath(
    window.location.pathname,
  );
  const isSelectedActionRemoved = currentSelectedEntity.id === removedId;

  // If removed item is not currently selected, don't redirect
  if (!isSelectedActionRemoved) {
    return {
      action: RedirectAction.NA,
    };
  }

  const indexOfTab = tabs.findIndex((item) => item.key === removedId);
  switch (indexOfTab) {
    case -1:
      // If no other action is remaining, navigate to the creation url
      return {
        action: RedirectAction.LIST,
      };
    case 0:
      // if the removed item is first item, then if tabs present, tabs + 1
      // else otherItems[0] -> TODO: consider changing this logic after discussion with
      // design team. May be new listing UI for side by side
      if (tabs.length > 1) {
        return {
          action: RedirectAction.ITEM,
          payload: tabs[1],
        };
      } else {
        return {
          action: RedirectAction.LIST,
        };
      }
    default:
      return {
        action: RedirectAction.ITEM,
        payload: tabs[indexOfTab - 1],
      };
  }
}

function* storeIDEViewChangeSaga(
  action: ReduxAction<{ view: EditorViewMode }>,
) {
  yield call(storeIDEViewMode, action.payload.view);
}

function* restoreIDEViewModeSaga() {
  const storedState: EditorViewMode = yield call(retrieveIDEViewMode);
  if (storedState) {
    yield put(setIdeEditorViewMode(storedState));
  }
}

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE,
      storeIDEViewChangeSaga,
    ),
    takeEvery(
      ReduxActionTypes.RESTORE_IDE_EDITOR_VIEW_MODE,
      restoreIDEViewModeSaga,
    ),
  ]);
}
