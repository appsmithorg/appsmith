import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { diff } from "deep-diff";
import { merge } from "lodash";
import { getAction } from "selectors/entitiesSelector";
import { getConfigInitialValues } from "components/formControls/utils";
import { getPathAndValueFromActionDiffObject } from "../../../../utils/getPathAndValueFromActionDiffObject";
import configureStore from "redux-mock-store";
import { setActionProperty } from "actions/pluginActionActions";
import initialState from "../__data__/InitialState.json";
import finalState from "../__data__/FinalState.json";

describe("missing key: where", () => {
  test("getPathAndValueFromActionDiffObject() works correctly", () => {
    const apiId = initialState.entities.actions[0].config.id;
    const action = getAction(initialState, apiId);
    const initialValues = {};
    const { plugins } = initialState.entities;
    const { editorConfigs, settingConfigs } = plugins;
    const pluginId = action?.pluginId ?? "";
    let editorConfig;

    if (editorConfigs && pluginId) {
      editorConfig = editorConfigs[pluginId];
      if (editorConfig) {
        merge(initialValues, getConfigInitialValues(editorConfig));
      }
    }
    let settingConfig;

    if (settingConfigs && pluginId) {
      settingConfig = settingConfigs[pluginId];
    }
    merge(initialValues, getConfigInitialValues(settingConfig));
    merge(initialValues, action);

    const actionObjectDiff = diff(action, initialValues);

    const { path = "", value = "" } = {
      ...getPathAndValueFromActionDiffObject(actionObjectDiff),
    };

    expect(path).toBeTruthy();
    expect(value).toBeTruthy();
    expect(path).toMatch(/actionConfiguration.pluginSpecifiedTemplates/);

    const middlewares = [];
    const mockStore = configureStore(middlewares);
    const store = mockStore(initialState);
    store.dispatch(
      setActionProperty({
        type: ReduxActionTypes.SET_ACTION_PROPERTY,
        payload: {
          actionId: apiId,
          propertyName: path,
          value: value,
        },
      }),
    );
    //TODO:
    setTimeout(() => {
      const stateAfterSetAction = store.getState();
      expect(stateAfterSetAction).toEqual(finalState);
    }, 2000);
  });
});
