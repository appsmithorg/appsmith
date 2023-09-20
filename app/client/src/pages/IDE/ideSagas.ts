import { all } from "@redux-saga/core/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { fork, put, select, takeEvery } from "redux-saga/effects";
import type { RecentEntity } from "../../components/editorComponents/GlobalSearch/utils";
import {
  getCurrentActions,
  getCurrentPageId,
  getPlugins,
  selectFilesForExplorer,
} from "@appsmith/selectors/entitiesSelector";
import type { ActionData } from "../../reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "../../reducers/entityReducers/jsActionsReducer";
import type { Item } from "./components/ListView";
import { PluginType } from "../../entities/Action";
import { findIndex, keyBy } from "lodash";
import { getPluginIcon } from "../Editor/Explorer/ExplorerIcons";
import type { Plugin } from "api/PluginApi";
import { getRecentJsList, getRecentQueryList } from "./ideSelector";
import { setRecentJsList, setRecentQueryList } from "./ideActions";
import { FocusEntity } from "../../navigation/FocusEntity";
import { getRecentEntities } from "../../selectors/globalSearchSelectors";
import history from "../../utils/history";
import { builderURL } from "../../RouteBuilder";
import { IDEAppState } from "./ideReducer";
import { setRecentEntities } from "../../actions/globalSearchActions";

const sortItems = (items: Item[], recentEntities: RecentEntity[]) => {
  return [...items].sort((a: any, b: any) => {
    const indexA = findIndex(recentEntities, (r: any) => r.id === a.key);
    const indexB = findIndex(recentEntities, (r: any) => r.id === b.key);
    if (indexA > -1 && indexB > -1) return indexA - indexB;
    if (indexA === -1 && indexB > -1) return 1;
    if (indexA > -1 && indexB === -1) return -1;
    return 0;
  });
};

function* setQueryRecentListSaga(recentEntities: RecentEntity[]) {
  const queries: ActionData[] = yield select(getCurrentActions);
  const plugins: Plugin[] = yield select(getPlugins);
  const sortedItems: Item[] = yield select(getRecentQueryList);
  const pluginGroups = keyBy(plugins, "id");
  const queryItems: Item[] = queries
    .filter((a) => a.config.pluginType !== PluginType.SAAS)
    .map((action) => ({
      name: action.config.name,
      key: action.config.id,
      type: action.config.pluginType,
      pluginId: action.config.pluginId,
      pluginType: action.config.pluginType,
      icon: getPluginIcon(pluginGroups[action.config.pluginId]),
    }));
  const filteredSortedItems = sortedItems.filter((item) =>
    queryItems.some((queryItem) => queryItem.key === item.key),
  );

  const newSortedList = sortItems(queryItems, recentEntities);
  if (newSortedList.length === 0) {
    yield put(setRecentQueryList(newSortedList));
    return;
  }

  if (filteredSortedItems.length === 0) {
    yield put(setRecentQueryList(newSortedList));
  }
  const currentItem = recentEntities[0];
  if (currentItem.type !== FocusEntity.QUERY) {
    return;
  }
  const currentItemId = currentItem.id;

  const indexOfCurrentItem = findIndex(
    filteredSortedItems,
    (r) => r.key === currentItemId,
  );
  if (indexOfCurrentItem > 3 || indexOfCurrentItem === -1) {
    yield put(setRecentQueryList(newSortedList));
  } else {
    const latestSortedList: Array<Item> = sortedItems
      .filter((s) => {
        const item = queryItems.find((j) => j.key === s.key);
        return !!item;
      })
      .map((s) => {
        const item = queryItems.find((j) => j.key === s.key) || { name: "" };
        return {
          ...s,
          name: item.name,
        };
      });
    yield put(setRecentQueryList(latestSortedList));
  }
}

function* setJsRecentListSaga(recentEntities: RecentEntity[]) {
  const allActions: any[] = yield select(selectFilesForExplorer);
  const sortedItems: Item[] = yield select(getRecentJsList);
  const jsCollections: JSCollectionData[] = allActions.filter((a: any) => {
    return a.type === "JS";
  });
  const jsItems: Item[] = jsCollections.map((a: any) => ({
    name: a.entity.name,
    key: a.entity.id,
    type: a.type,
  }));
  // Filter out js objects which are not of the current page
  const filteredSortedItems = sortedItems.filter((item) =>
    jsItems.some((jsItem) => jsItem.key === item.key),
  );

  const newSortedList = sortItems(jsItems, recentEntities);
  // On a new page js object list will be always empty. Since the recent js list is our source of
  // truth we reset this to empty else it will carry the previous pages's js objects
  if (newSortedList.length === 0) {
    yield put(setRecentJsList(newSortedList));
    return;
  }

  if (filteredSortedItems.length === 0) {
    yield put(setRecentJsList(newSortedList));
  }

  const currentItem = recentEntities[0];
  if (currentItem.type !== FocusEntity.JS_OBJECT) {
    return;
  }

  const currentItemId = currentItem.id;
  const indexOfCurrentItem = findIndex(
    filteredSortedItems,
    (r) => r.key === currentItemId,
  );
  if (indexOfCurrentItem > 3 || indexOfCurrentItem === -1) {
    yield put(setRecentJsList(newSortedList));
  } else {
    const latestSortedList: Array<Item> = sortedItems
      .filter((s) => {
        const item = jsItems.find((j) => j.key === s.key);
        return !!item;
      })
      .map((s) => {
        const item = jsItems.find((j) => j.key === s.key) || { name: "" };
        return {
          ...s,
          name: item.name,
        };
      });
    yield put(setRecentJsList(latestSortedList));
  }
}

/**
 * Given the list of items and a currently selected item
 * provide a sorted list where top 4 items are recently used.
 * if the current item is not in the top 4, add it and return the new list
 * if the current item is already in the top 4, no change to list
 **/
function* setPageRecentListSaga(action: ReduxAction<RecentEntity[]>) {
  yield all([
    fork(setQueryRecentListSaga, action.payload),
    fork(setJsRecentListSaga, action.payload),
  ]);
}

function* handleDeleteSaga(action: ReduxAction<{ id: string }>) {
  const { id } = action.payload;
  const pageId: string = yield select(getCurrentPageId);
  const recentEntities: RecentEntity[] = yield select(getRecentEntities);
  const removedEntities = recentEntities.filter((e) => e.id !== id);
  yield put(setRecentEntities(removedEntities));
  let suffix = "/queries";
  let items: Item[] = yield select(getRecentQueryList);
  const leftItems = items.filter((item) => item.key !== id);
  const item = leftItems[0];
  if (item) {
    suffix = `${suffix}/${item.key}`;
  }
  yield put(setRecentQueryList(leftItems));
  if (action.type === ReduxActionTypes.DELETE_JS_ACTION_SUCCESS) {
    suffix = "/js";
    items = yield select(getRecentJsList);
    const leftItems = items.filter((item) => item.key !== id);
    const item = leftItems[0];
    if (item) {
      suffix = `${suffix}/${item.key}`;
    }
    yield put(setRecentJsList(leftItems));
  }
  history.push(
    builderURL({
      pageId,
      ideState: IDEAppState.Page,
      suffix,
    }),
  );
}

function* resetEntityListSaga() {
  const recentEntities: RecentEntity[] = yield select(getRecentEntities);
  yield all([
    fork(setQueryRecentListSaga, recentEntities),
    fork(setJsRecentListSaga, recentEntities),
  ]);
}

export default function* watchIDESagas() {
  yield all([
    takeEvery(ReduxActionTypes.SET_RECENT_ENTITIES, setPageRecentListSaga),
    takeEvery(
      [
        ReduxActionTypes.DELETE_ACTION_SUCCESS,
        ReduxActionTypes.DELETE_JS_ACTION_SUCCESS,
      ],
      handleDeleteSaga,
    ),
    takeEvery(
      [
        ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS,
        ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS,
        ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
      ],
      resetEntityListSaga,
    ),
  ]);
}
