import { getFormValues, isValid, getFormInitialValues } from "redux-form";
import type { DefaultRootState } from "react-redux";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import type {
  ConditionalOutput,
  DynamicValues,
  FormEvalOutput,
  FormEvaluationState,
} from "reducers/evaluationReducers/formEvaluationReducer";
import { createSelector } from "reselect";
import { isEmpty, replace } from "lodash";
import { getDataTree } from "./dataTreeSelectors";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { Action } from "entities/Action";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { getActionIdFromURL } from "ee/pages/Editor/Explorer/helpers";
import { extractConditionalOutput } from "components/formControls/utils";
import { getActionByBaseId } from "ee/selectors/entitiesSelector";

export interface GetFormData {
  initialValues: Record<string, unknown>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any;
  valid: boolean;
}

export const getFormData = (
  state: DefaultRootState,
  formName: string,
): GetFormData => {
  const initialValues = getFormInitialValues(formName)(state);
  const values = getFormValues(formName)(state);
  const valid = isValid(formName)(state);

  return { initialValues, values, valid };
};

export const getApiName = (state: DefaultRootState, id: string) => {
  return state.entities.actions.find(
    (action: ActionData) => action.config.id === id,
  )?.config.name;
};

export const getFormEvaluationState = (
  state: DefaultRootState,
): FormEvaluationState => state.evaluations.formEvaluation;

export const getFormConfigConditionalOutput = (
  state: DefaultRootState,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
): ConditionalOutput => {
  const baseActionId = getActionIdFromURL();
  const action = getActionByBaseId(state, baseActionId as string);
  const actionId = action?.id ?? "";
  const conditionalOutput = extractConditionalOutput(
    config,
    state.evaluations.triggers[actionId],
  );

  return conditionalOutput;
};

// Selector to return the fetched values of the form components, only called for components that
// have the fetchOptionsDynamically option set to true
export const getDynamicFetchedValues = (
  state: DefaultRootState,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
): DynamicValues => {
  const baseActionId = getActionIdFromURL();
  const action = getActionByBaseId(state, baseActionId as string);
  const actionId = action?.id ?? "";
  const conditionalOutput = extractConditionalOutput(
    config,
    state.evaluations.triggers[actionId],
  );

  return !!conditionalOutput.fetchDynamicValues
    ? conditionalOutput.fetchDynamicValues
    : ({} as DynamicValues);
};

export const getDynamicTriggers = (
  state: DefaultRootState,
  actionId: string,
): FormEvalOutput | undefined => {
  const allTriggers = state.evaluations.triggers[actionId];
  const triggersAllowedToFetch: FormEvalOutput = {};

  if (!isEmpty(allTriggers)) {
    Object.entries(allTriggers).forEach(([key, value]) => {
      if (value?.fetchDynamicValues?.allowedToFetch) {
        triggersAllowedToFetch[key] = value;
      }
    });
  }

  return !isEmpty(triggersAllowedToFetch) ? triggersAllowedToFetch : undefined;
};

interface ConfigErrorProps {
  configProperty: string;
  formName: string;
}

export const getConfigErrors = createSelector(
  getDataTree,
  (state: DefaultRootState, props: ConfigErrorProps) =>
    getFormValues(props.formName)(state),
  (_: DefaultRootState, props: ConfigErrorProps) => props.configProperty,
  (dataTree: DataTree, formValues: Partial<Action>, configProperty: string) => {
    // action that corresponds to this form control
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
