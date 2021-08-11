import { put, select } from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getAppStoreName } from "constants/AppConstants";
import localStorage from "utils/localStorage";
import {
  updateAppPersistentStore,
  updateAppTransientStore,
} from "actions/pageActions";
import AppsmithConsole from "utils/AppsmithConsole";
import { getAppStoreData } from "selectors/entitiesSelector";
import { StoreValueActionDescription } from "entities/DataTree/actionTriggers";

export default function* storeValueLocally(
  action: StoreValueActionDescription["payload"],
) {
  if (action.persist) {
    const appId = yield select(getCurrentApplicationId);
    const appStoreName = getAppStoreName(appId);
    const existingStore = localStorage.getItem(appStoreName) || "{}";
    const parsedStore = JSON.parse(existingStore);
    parsedStore[action.key] = action.value;
    const storeString = JSON.stringify(parsedStore);
    localStorage.setItem(appStoreName, storeString);
    yield put(updateAppPersistentStore(parsedStore));
    AppsmithConsole.info({
      text: `store('${action.key}', '${action.value}', true)`,
    });
  } else {
    const existingStore = yield select(getAppStoreData);
    const newTransientStore = {
      ...existingStore.transient,
      [action.key]: action.value,
    };
    yield put(updateAppTransientStore(newTransientStore));
    AppsmithConsole.info({
      text: `store('${action.key}', '${action.value}', false)`,
    });
  }
}
