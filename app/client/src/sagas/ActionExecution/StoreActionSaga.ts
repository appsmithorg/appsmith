import { put, select } from "redux-saga/effects";
import { getAppStoreName } from "constants/AppConstants";
import localStorage from "utils/localStorage";
import { updateAppStore } from "actions/pageActions";
import AppsmithConsole from "utils/AppsmithConsole";
import { getAppStoreData } from "selectors/entitiesSelector";
import {
  RemoveValueActionDescription,
  StoreValueActionDescription,
} from "@appsmith/entities/DataTree/actionTriggers";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { AppStoreState } from "reducers/entityReducers/appReducer";

export function* storeValueInBulk(triggers: StoreValueActionDescription[]) {
  const applicationId: string = yield select(getCurrentApplicationId);
  const branch: string | undefined = yield select(getCurrentGitBranch);
  const appStoreName = getAppStoreName(applicationId, branch);
  const existingLocalStore = localStorage.getItem(appStoreName) || "{}";
  const parsedLocalStore = JSON.parse(existingLocalStore);
  const currentStore: AppStoreState = yield select(getAppStoreData);
  for (const t of triggers) {
    const { key, persist, value } = t.payload;
    if (persist) {
      parsedLocalStore[key] = value;
    }
    currentStore[key] = value;
  }
  yield put(updateAppStore(currentStore));
  // AppsmithConsole.info({
  //   text: `store('${key}', '${value}', ${persist})`,
  // });
  const storeString = JSON.stringify(parsedLocalStore);
  localStorage.setItem(appStoreName, storeString);
}

export default function* storeValueLocally(
  action: StoreValueActionDescription["payload"],
) {
  if (action.persist) {
    const applicationId: string = yield select(getCurrentApplicationId);
    const branch: string | undefined = yield select(getCurrentGitBranch);
    const appStoreName = getAppStoreName(applicationId, branch);
    const existingStore = localStorage.getItem(appStoreName) || "{}";
    const parsedStore = JSON.parse(existingStore);
    parsedStore[action.key] = action.value;
    const storeString = JSON.stringify(parsedStore);
    localStorage.setItem(appStoreName, storeString);
  }
  const existingStore: AppStoreState = yield select(getAppStoreData);
  const newStore = {
    ...existingStore,
    [action.key]: action.value,
  };
  yield put(updateAppStore(newStore, action));
  AppsmithConsole.info({
    text: `store('${action.key}', '${action.value}', ${action.persist})`,
  });
}

export function* removeLocalValue(
  action: RemoveValueActionDescription["payload"],
) {
  const applicationId: string = yield select(getCurrentApplicationId);
  const branch: string | undefined = yield select(getCurrentGitBranch);
  const appStoreName = getAppStoreName(applicationId, branch);
  const existingStore = localStorage.getItem(appStoreName) || "{}";
  const parsedStore = JSON.parse(existingStore);
  delete parsedStore[action.key];
  const storeString = JSON.stringify(parsedStore);
  localStorage.setItem(appStoreName, storeString);
  const appStore: AppStoreState = yield select(getAppStoreData);
  delete appStore[action.key];
  yield put(updateAppStore(appStore));
  AppsmithConsole.info({
    text: `remove('${action.key}')`,
  });
}

export function* clearLocalStore() {
  const applicationId: string = yield select(getCurrentApplicationId);
  const branch: string | undefined = yield select(getCurrentGitBranch);
  const appStoreName = getAppStoreName(applicationId, branch);
  localStorage.setItem(appStoreName, "{}");
  yield put(updateAppStore({}));
  AppsmithConsole.info({
    text: `clear()`,
  });
}
