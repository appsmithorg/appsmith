import {
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "constants/ReduxActionConstants";

export const fetchPlugins = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.FETCH_PLUGINS_REQUEST,
});

export const fetchPluginForm = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.FETCH_PLUGIN_FORM_INIT,
    payload,
  };
};

export const fetchDBPluginForms = () => {
  return {
    type: ReduxActionTypes.FETCH_DB_PLUGIN_FORMS_INIT,
  };
};
