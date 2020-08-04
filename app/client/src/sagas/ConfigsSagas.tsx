import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { WidgetType } from "constants/WidgetConstants";
import { PropertyConfig } from "reducers/entityReducers/propertyPaneConfigReducer";
import { generateReactKey } from "utils/generators";
import LOCAL_CONFIG from "mockResponses/PropertyPaneConfigResponse";

const generateConfigWithIds = (config: PropertyConfig) => {
  const addObjectId = (obj: any) => {
    obj.id = generateReactKey();
    if (obj.hasOwnProperty("children")) {
      obj.children = obj.children.map(addObjectId);
    }
    return obj;
  };
  Object.keys(config).forEach((widgetType: string) => {
    config[widgetType as WidgetType] = config[widgetType as WidgetType].map(
      addObjectId,
    );
  });
  return config;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function* getLocalPropertyPaneConfigSaga() {
  // FOR DEV WORK ONLY
  try {
    const localConfig = LOCAL_CONFIG;
    const config = generateConfigWithIds(localConfig.config);
    yield put({
      type: ReduxActionTypes.FETCH_PROPERTY_PANE_CONFIGS_SUCCESS,
      payload: {
        config,
      },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PROPERTY_PANE_CONFIGS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* configsSaga() {
  try {
    const sagasToCall = [];
    // Uncomment bellow to use local config instead
    sagasToCall.push(call(getLocalPropertyPaneConfigSaga));

    // sagasToCall.push(call(fetchWidgetCardsConfigsSaga, widgetCardsPaneId));
    // sagasToCall.push(call(fetchWidgetConfigsSaga, widgetConfigsId));
    yield all(sagasToCall);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CONFIGS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* configsSagas() {
  yield takeLatest(ReduxActionTypes.FETCH_CONFIGS_INIT, configsSaga);
}
