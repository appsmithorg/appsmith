import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { call, put, select } from "redux-saga/effects";
import { getJSTabs, getQueryTabs } from "selectors/ideSelectors";
import { setJSTabs, setQueryTabs } from "actions/ideActions";

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
