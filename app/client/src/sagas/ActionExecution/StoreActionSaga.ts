import { ExecuteActionPayloadEvent } from "constants/AppsmithActionConstants/ActionConstants";
import { put, select, take } from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getAppStoreName } from "constants/AppConstants";
import localStorage from "utils/localStorage";
import {
  updateAppPersistentStore,
  updateAppTransientStore,
} from "actions/pageActions";
import AppsmithConsole from "utils/AppsmithConsole";
import { getAppStoreData } from "selectors/entitiesSelector";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { StoreValueActionDescription } from "entities/DataTree/actionTriggers";

export default function* storeValueLocally(
  action: StoreValueActionDescription["payload"],
  event: ExecuteActionPayloadEvent,
) {
  try {
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
    // Wait for an evaluation before completing this trigger effect
    // This makes this trigger work in sync and not trigger
    // another effect till the values are reflected in
    // the dataTree
    yield take(ReduxActionTypes.SET_EVALUATED_TREE);
    if (event.callback) event.callback({ success: true });
  } catch (err) {
    if (event.callback) event.callback({ success: false });
  }
}
