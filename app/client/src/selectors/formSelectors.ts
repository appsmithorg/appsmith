import { getFormValues, isValid, getFormInitialValues } from "redux-form";
import { AppState } from "reducers";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import {
  DynamicValues,
  FormEvaluationState,
} from "reducers/evaluationReducers/formEvaluationReducer";
import { createSelector } from "reselect";
import { replace } from "lodash";
import { getDataTree } from "./dataTreeSelectors";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { Action } from "entities/Action";
import { EvaluationError } from "utils/DynamicBindingUtils";
import { getActionIdFromURL } from "pages/Editor/Explorer/helpers";
import { extractConditionalOutput } from "components/formControls/utils";

export type GetFormData = {
  initialValues: Record<string, unknown>;
  values: any;
  valid: boolean;
};

export const getFormData = (state: AppState, formName: string): GetFormData => {
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

export const getFormEvaluationState = (state: AppState): FormEvaluationState =>
  state.evaluations.formEvaluation;

// Selector to return the fetched values of the form components, only called for components that
// have the fetchOptionsDynamically option set to true
export const getDynamicFetchedValues = (
  state: AppState,
  config: any,
): DynamicValues => {
  const conditionalOutput = extractConditionalOutput(
    config,
    state.evaluations.triggers[getActionIdFromURL() as string],
  );
  return !!conditionalOutput.fetchDynamicValues
    ? conditionalOutput.fetchDynamicValues
    : ({} as DynamicValues);
};

type ConfigErrorProps = { configProperty: string; formName: string };

export const getConfigErrors = createSelector(
  getDataTree,
  (state: AppState, props: ConfigErrorProps) =>
    getFormValues(props.formName)(state),
  (_: AppState, props: ConfigErrorProps) => props.configProperty,
  (dataTree: DataTree, formValues: Partial<Action>, configProperty: string) => {
    // action that corresponds to this form control
    let action: any;
    let configErrors: EvaluationError[] = [];

    // if form value exists, use the name of the form(which is the action's name) to get the action details
    // from the data tree, then store it in the action variable
    if (formValues && formValues.name) {
      if (formValues.name in dataTree) {
        // get action details from data tree
        action = dataTree[formValues.name];

        // extract the error object from the action's details object.
        const actionError = action && action?.__evaluation__?.errors;

        // get the configProperty for this form control and format it to resemble the format used in the action details errors object.
        const formattedConfig = replace(
          configProperty,
          "actionConfiguration",
          "config",
        );

        // grab the errors specific to this configProperty and store it in configErrors.
        if (actionError && formattedConfig in actionError) {
          configErrors = actionError[formattedConfig];
        }
      }
    }

    return configErrors;
  },
);
