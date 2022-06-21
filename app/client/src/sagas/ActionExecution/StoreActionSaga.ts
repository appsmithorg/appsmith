import { put, select, take } from "redux-saga/effects";
import { getAppStoreName } from "constants/AppConstants";
import localStorage from "utils/localStorage";
import {
  updateAppPersistentStore,
  updateAppTransientStore,
} from "actions/pageActions";
import AppsmithConsole from "utils/AppsmithConsole";
import { getAppStoreData } from "selectors/entitiesSelector";
import { StoreValueActionDescription } from "entities/DataTree/actionTriggers";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { AppStoreState } from "reducers/entityReducers/appReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

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
    yield put(updateAppPersistentStore(parsedStore, action));
    AppsmithConsole.info({
      text: `store('${action.key}', '${action.value}', true)`,
    });
  } else {
    const existingStore: AppStoreState = yield select(getAppStoreData);
    const newTransientStore = {
      ...existingStore.transient,
      [action.key]: action.value,
    };
    yield put(updateAppTransientStore(newTransientStore, action));
    AppsmithConsole.info({
      text: `store('${action.key}', '${action.value}', false)`,
    });
  }
  /* It is possible that user calls multiple storeValue function together, in such case we need to track completion of each action separately
  We use uniqueActionRequestId to differentiate each storeValueAction here.
  */
  while (true) {
    const returnedAction: StoreValueActionDescription = yield take(
      ReduxActionTypes.UPDATE_APP_STORE_EVALUATED,
    );
    if (!returnedAction?.payload?.uniqueActionRequestId) {
      break;
    }

    const { uniqueActionRequestId } = returnedAction.payload;
    if (uniqueActionRequestId === action.uniqueActionRequestId) {
      break;
    }
  }
}
