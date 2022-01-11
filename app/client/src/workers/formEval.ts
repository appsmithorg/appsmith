import {
  FormEvalOutput,
  FormEvaluationState,
} from "../reducers/evaluationReducers/formEvaluationReducer";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ActionConfig } from "entities/Action";
import { FormEvalActionPayload } from "sagas/FormEvaluationSaga";
import { FormConfig } from "components/formControls/BaseControl";
import { isEmpty } from "lodash";

export enum ConditionType {
  HIDE = "hide", // When set, the component will be shown until condition is true
  SHOW = "show", // When set, the component will be hidden until condition is true
  ENABLE = "enable", // When set, the component will be enabled until condition is true
  DISABLE = "disable", // When set, the component will be disabled until condition is true
}

// Object to hold the initial eval object
let finalEvalObj: FormEvalOutput;

// Recursive function to generate the evaluation state for form config
const generateInitialEvalState = (formConfig: FormConfig) => {
  const visible = false;
  const enabled = true;
  let conditionTypes = {};

  // Any element is only added to the eval state if they have a conditional statement present, if not they are allowed to be rendered
  if ("conditionals" in formConfig && !!formConfig.conditionals) {
    let key = "unknowns";

    // A unique key is used to refer the object in the eval state, can be propertyName, configProperty or identifier
    if ("propertyName" in formConfig && !!formConfig.propertyName) {
      key = formConfig.propertyName;
    } else if ("configProperty" in formConfig && !!formConfig.configProperty) {
      key = formConfig.configProperty;
    } else if ("identifier" in formConfig && !!formConfig.identifier) {
      key = formConfig.identifier;
    }

    const allConditionTypes = Object.keys(formConfig.conditionals);
    if (
      allConditionTypes.includes(ConditionType.HIDE) ||
      allConditionTypes.includes(ConditionType.SHOW)
    ) {
      conditionTypes = {
        ...conditionTypes,
        visible,
      };
    }

    if (
      allConditionTypes.includes(ConditionType.ENABLE) ||
      allConditionTypes.includes(ConditionType.DISABLE)
    ) {
      conditionTypes = {
        ...conditionTypes,
        enabled,
      };
    }
    // Conditionals are stored in the eval state itself for quick access
    finalEvalObj[key] = {
      ...conditionTypes,
      conditionals: formConfig.conditionals,
    };
  }

  if ("children" in formConfig && !!formConfig.children)
    formConfig.children.forEach((config: FormConfig) =>
      generateInitialEvalState(config),
    );
};

// Function to run the eval for the whole form when data changes
function evaluate(
  actionConfiguration: ActionConfig,
  currentEvalState: FormEvalOutput,
) {
  Object.keys(currentEvalState).forEach((key: string) => {
    try {
      if (currentEvalState[key].hasOwnProperty("conditionals")) {
        const conditionBlock = currentEvalState[key].conditionals;
        if (!!conditionBlock) {
          Object.keys(conditionBlock).forEach((conditionType: string) => {
            const output = eval(conditionBlock[conditionType]);
            if (conditionType === ConditionType.HIDE) {
              currentEvalState[key].visible = !output;
            } else if (conditionType === ConditionType.SHOW) {
              currentEvalState[key].visible = output;
            } else if (conditionType === ConditionType.DISABLE) {
              currentEvalState[key].enabled = !output;
            } else if (conditionType === ConditionType.ENABLE) {
              currentEvalState[key].enabled = output;
            }
          });
        }
      }
    } catch (e) {}
  });
  return currentEvalState;
}

// Fetches current evaluation and runs a new one based on the new data
function getFormEvaluation(
  formId: string,
  actionConfiguration: ActionConfig,
  currentEvalState: FormEvaluationState,
): FormEvaluationState {
  // Only change the form evaluation state if the form ID is same or the evaluation state is present
  if (!!currentEvalState && currentEvalState.hasOwnProperty(formId)) {
    currentEvalState[formId] = evaluate(
      actionConfiguration,
      currentEvalState[formId],
    );
  }

  return currentEvalState;
}

// Filter function to assign a function to the Action dispatched
export function setFormEvaluationSaga(
  type: string,
  payload: FormEvalActionPayload,
  currentEvalState: FormEvaluationState,
) {
  if (type === ReduxActionTypes.INIT_FORM_EVALUATION) {
    finalEvalObj = {};

    // Config is extracted from the editor json first
    if (
      "editorConfig" in payload &&
      !!payload.editorConfig &&
      payload.editorConfig.length > 0
    ) {
      payload.editorConfig.forEach((config: FormConfig) => {
        generateInitialEvalState(config);
      });
    }

    // Then the form config is extracted from the settings json
    if (
      "settingConfig" in payload &&
      !!payload.settingConfig &&
      payload.settingConfig.length > 0
    ) {
      payload.settingConfig.forEach((config: FormConfig) => {
        generateInitialEvalState(config);
      });
    }

    // if the evaluations are empty, then the form is not valid, don't mutate the state
    if (isEmpty(finalEvalObj)) {
      return currentEvalState;
    }

    // This is the initial evaluation state, evaluations can now be run on top of this
    return { [payload.formId]: finalEvalObj };
  } else {
    const { actionConfiguration, formId } = payload;
    // In case the formData is not ready or the form is not of type UQI, return empty state
    if (!actionConfiguration || !actionConfiguration.formData) {
      return currentEvalState;
    } else {
      return getFormEvaluation(formId, actionConfiguration, currentEvalState);
    }
  }
}
