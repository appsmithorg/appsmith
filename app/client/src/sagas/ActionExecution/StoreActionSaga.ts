import { put, select } from "redux-saga/effects";
import { getAppStoreName } from "constants/AppConstants";
import localStorage from "utils/localStorage";
import { updateAppStore } from "actions/pageActions";
import AppsmithConsole from "utils/AppsmithConsole";
import { getAppStoreData } from "selectors/entitiesSelector";
import {
  ClearStoreActionDescription,
  RemoveValueActionDescription,
  StoreValueActionDescription,
} from "@appsmith/entities/DataTree/actionTriggers";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { AppStoreState } from "reducers/entityReducers/appReducer";
import { Severity, LOG_CATEGORY } from "entities/AppsmithConsole";
import moment from "moment";

type StoreOperation =
  | StoreValueActionDescription
  | ClearStoreActionDescription
  | RemoveValueActionDescription;

export function* handleStoreOperations(triggers: StoreOperation[]) {
  const applicationId: string = yield select(getCurrentApplicationId);
  const branch: string | undefined = yield select(getCurrentGitBranch);
  const appStoreName = getAppStoreName(applicationId, branch);
  const existingLocalStore = localStorage.getItem(appStoreName) || "{}";
  let parsedLocalStore = JSON.parse(existingLocalStore);
  let currentStore: AppStoreState = yield select(getAppStoreData);
  const logs: string[] = [];
  for (const t of triggers) {
    const { type } = t;
    if (type === "STORE_VALUE") {
      const { key, persist, value } = t.payload;
      if (persist) {
        parsedLocalStore[key] = value;
      }
      currentStore[key] = value;
      logs.push(`storeValue('${key}', '${value}', ${persist})`);
    } else if (type === "REMOVE_VALUE") {
      const { key } = t.payload;
      delete parsedLocalStore[key];
      delete currentStore[key];
      logs.push(`removeValue('${key}')`);
    } else if (type === "CLEAR_STORE") {
      parsedLocalStore = {};
      currentStore = {};
      logs.push(`clearStore()`);
    }
  }
  yield put(updateAppStore(currentStore));
  const storeString = JSON.stringify(parsedLocalStore);
  localStorage.setItem(appStoreName, storeString);
  AppsmithConsole.addLogs(
    logs.map((text) => ({
      text,
      severity: Severity.INFO,
      category: LOG_CATEGORY.USER_GENERATED,
      timestamp: moment().format("hh:mm:ss"),
    })),
  );
}
