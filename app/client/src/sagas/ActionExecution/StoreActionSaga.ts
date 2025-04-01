import { put, select } from "redux-saga/effects";
import { getAppStoreName } from "constants/AppConstants";
import localStorage from "utils/localStorage";
import { updateAppStore } from "actions/pageActions";
import AppsmithConsole from "utils/AppsmithConsole";
import { getAppStoreData } from "ee/selectors/entitiesSelector";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import type { AppStoreState } from "reducers/entityReducers/appReducer";
import { Severity, LOG_CATEGORY } from "entities/AppsmithConsole";
import type {
  TClearStoreDescription,
  TRemoveValueDescription,
  TStoreValueDescription,
} from "workers/Evaluation/fns/storeFns";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";

type StoreOperation =
  | TStoreValueDescription
  | TClearStoreDescription
  | TRemoveValueDescription;

export function* handleStoreOperations(triggers: StoreOperation[]) {
  const applicationId: string = yield select(getCurrentApplicationId);
  const branch: string | undefined = yield select(getCurrentGitBranch);
  const appStoreName = getAppStoreName(applicationId, branch);
  const existingLocalStore = localStorage.getItem(appStoreName) || "{}";
  let parsedLocalStore = JSON.parse(existingLocalStore);
  let currentStore: AppStoreState = yield select(getAppStoreData);
  const logs: { text: string; state?: object }[] = [];

  for (const t of triggers) {
    const { type } = t;

    if (type === "STORE_VALUE") {
      const { key, persist, value } = t.payload;

      if (persist) {
        parsedLocalStore[key] = value;
      }

      currentStore[key] = value;
      logs.push({
        text: "storeValue triggered",
        state: { key, value, persist },
      });
    } else if (type === "REMOVE_VALUE") {
      const { key } = t.payload;

      delete parsedLocalStore[key];
      delete currentStore[key];
      logs.push({
        text: "removeValue triggered",
        state: { key },
      });
    } else if (type === "CLEAR_STORE") {
      parsedLocalStore = {};
      currentStore = {};
      logs.push({
        text: "clearStore triggered",
      });
    }
  }

  yield put(updateAppStore(currentStore));
  const storeString = JSON.stringify(parsedLocalStore);

  localStorage.setItem(appStoreName, storeString);
  AppsmithConsole.addLogs(
    logs.map(({ state, text }) => ({
      text,
      state,
      severity: Severity.INFO,
      category: LOG_CATEGORY.PLATFORM_GENERATED,
      timestamp: Date.now().toString(),
      isExpanded: false,
    })),
  );
}
