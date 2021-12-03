import { getFormValues, isValid, getFormInitialValues } from "redux-form";
import { AppState } from "reducers";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { UIComponentTypes } from "../api/PluginApi";
import { Plugin } from "api/PluginApi";

type GetFormData = (
  state: AppState,
  formName: string,
) => { initialValues: any; values: any; valid: boolean };

export const getFormData: GetFormData = (state, formName) => {
  const initialValues = getFormInitialValues(formName)(state);
  const values = getFormValues(formName)(state);
  const valid = isValid(formName)(state);
  return { initialValues, values, valid };
};

export const getApiName = (state: AppState, id: string) => {
  return state.entities.actions.find(
    (action: ActionData) => action.config.id === id,
  )?.config.name;
};

export const getFormEvaluationState = (state: AppState) =>
  state.evaluations.formEvaluation;

// Selector to get UIComponent type from the redux state
export const getUIComponent = (pluginId: string, allPlugins: Plugin[]) => {
  let uiComponent = UIComponentTypes.DbEditorForm;

  if (!!pluginId) {
    // Adding uiComponent field to switch form type to UQI or allow for backward compatibility
    const plugin = allPlugins.find((plugin: Plugin) =>
      !!pluginId ? plugin.id === pluginId : false,
    );
    // Defaults to old value, new value can be DBEditorForm or UQIDBEditorForm
    if (plugin) {
      uiComponent = plugin.uiComponent;
    }
  }
  return uiComponent;
};
