import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { call, put, select } from "redux-saga/effects";
import { getJSTabs, getQueryTabs } from "selectors/ideSelectors";
import { setJSTabs, setQueryTabs } from "actions/ideActions";
import history from "../utils/history";
import { jsCollectionAddURL, queryAddURL } from "@appsmith/RouteBuilder";
import type { EditorSegmentList } from "@appsmith/selectors/appIDESelectors";
import { groupAndSortEntitySegmentList } from "@appsmith/selectors/appIDESelectors";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  getCurrentPageId,
  getJSSegmentItems,
  getQuerySegmentItems,
} from "@appsmith/selectors/entitiesSelector";
import { getQueryEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/Query/utils";
import { getJSEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/JS/utils";
import log from "loglevel";

export function* updateIDETabsOnRouteChangeSaga(entityInfo: FocusEntityInfo) {
  const { entity, id } = entityInfo;
  if (entity === FocusEntity.JS_OBJECT) {
    const jsTabs: string[] = yield select(getJSTabs);
    const newTabs: string[] = yield call(getUpdatedTabs, id, jsTabs);
    yield put(setJSTabs(newTabs));
  }
  if (entity === FocusEntity.QUERY) {
    const queryTabs: string[] = yield select(getQueryTabs);
    const newTabs: string[] = yield call(getUpdatedTabs, id, queryTabs);
    yield put(setQueryTabs(newTabs));
  }
}

function* getUpdatedTabs(newId: string, currentTabs: string[]) {
  if (currentTabs.includes(newId)) return currentTabs;
  let newTabs = [newId, ...currentTabs];
  if (newTabs.length > 5) {
    newTabs = newTabs.slice(0, 5);
  }
  return newTabs;
}

export function* handleJSEntityRedirect(deletedId: string) {
  const pageId: string = yield select(getCurrentPageId);
  const allJsItems: EntityItem[] = yield select(getJSSegmentItems);
  const redirectAction = getNextEntityAfterDelete(deletedId, allJsItems);
  switch (redirectAction.action) {
    case RedirectAction.CREATE:
      history.push(jsCollectionAddURL({}));
      break;
    case RedirectAction.ITEM:
      if (!redirectAction.payload) {
        log.error("Redirect item does not have a payload");
        history.push(jsCollectionAddURL({}));
        break;
      }
      const { payload } = redirectAction;
      history.push(getJSEntityItemUrl(payload, pageId));
      break;
  }
}

export function* handleQueryEntityRedirect(deletedId: string) {
  const pageId: string = yield select(getCurrentPageId);
  const allQueryItems: EntityItem[] = yield select(getQuerySegmentItems);
  const redirectAction = getNextEntityAfterDelete(deletedId, allQueryItems);
  switch (redirectAction.action) {
    case RedirectAction.CREATE:
      history.push(queryAddURL({}));
      break;
    case RedirectAction.ITEM:
      if (!redirectAction.payload) {
        history.push(queryAddURL({}));
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
 * 2. If it was the only item, navigate to a creation url
 * 3. If there are other items, navigate to an item close to the current one
 * **/

enum RedirectAction {
  NA = "NA", // No action is needed
  CREATE = "CREATE", // Navigate to a creation URL
  ITEM = "ITEM", // Navigate to this item
}
interface RedirectActionDescription {
  action: RedirectAction;
  payload?: EntityItem;
}

function getNextEntityAfterDelete(
  deletedId: string,
  allItems: EntityItem[],
): RedirectActionDescription {
  const currentSelectedEntity = identifyEntityFromPath(
    window.location.pathname,
  );
  const isSelectedActionDeleted = currentSelectedEntity.id === deletedId;

  // If deleted item is not currently selected, don't redirect
  if (!isSelectedActionDeleted) {
    return {
      action: RedirectAction.NA,
    };
  }

  const otherItems = allItems.filter((a) => deletedId !== a.key);
  // If no other action is remaining, navigate to the creation url
  if (otherItems.length === 0) {
    return {
      action: RedirectAction.CREATE,
    };
  }

  // Check if another action is present in the group and redirect to it, or else
  // navigate to tht top of the list
  const currentSortedList: EditorSegmentList =
    groupAndSortEntitySegmentList(allItems);

  let remainingGroupEntities: EntityItem[] = [];
  for (const { items } of currentSortedList) {
    if (items.find((a) => a.key === deletedId)) {
      remainingGroupEntities = items.filter((a) => a.key !== deletedId);
      break;
    }
  }

  if (remainingGroupEntities.length === 0) {
    return {
      action: RedirectAction.ITEM,
      payload: otherItems[0],
    };
  } else {
    return {
      action: RedirectAction.ITEM,
      payload: remainingGroupEntities[0],
    };
  }
}
