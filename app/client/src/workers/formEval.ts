import { FormEvaluationState } from "../reducers/evaluationReducers/formEvaluationReducer";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ActionConfig } from "entities/Action";

export enum ConditionType {
  HIDE = "hide", // When set, the component will be shown until condition is true
  SHOW = "show", // When set, the component will be hidden until condition is true
}

// Object to hold the initial eval object
let finalEvalObj: { [x: string]: { visible: boolean; conditionals: any } };

// Recursive function to generate the evaluation state for form config
const generateInitialEvalState = (formConfig: any) => {
  const visible = false;

  // Any element is only added to the eval state if they have a conditional statement present, if not they are allowed to be rendered
  if (formConfig.hasOwnProperty("conditionals")) {
    let key = "unknowns";

    // A unique key is used to refer the object in the eval state, can be propertyName, configProperty or identifier
    if (formConfig.hasOwnProperty("propertyName")) {
      key = formConfig.propertyName;
    } else if (formConfig.hasOwnProperty("configProperty")) {
      key = formConfig.configProperty;
    } else if (formConfig.hasOwnProperty("identifier")) {
      key = formConfig.identifier;
    }

    // Conditionals are stored in the eval state itself for quick access
    finalEvalObj[key] = {
      visible,
      conditionals: formConfig.conditionals,
    };
  }

  if (formConfig.children)
    formConfig.children.forEach((config: any) =>
      generateInitialEvalState(config),
    );
};

// Function to run the eval for the whole form when data changes
function evaluate(
  actionConfiguration: ActionConfig,
  currentEvalState: FormEvaluationState,
) {
  Object.keys(currentEvalState).forEach((key: string) => {
    try {
      if (currentEvalState[key].hasOwnProperty("conditionals")) {
        const conditionBlock = currentEvalState[key].conditionals;
        Object.keys(conditionBlock).forEach((conditionType) => {
          const output = eval(conditionBlock[conditionType]);
          if (conditionType === ConditionType.HIDE) {
            currentEvalState[key].visible = !output;
          } else if (conditionType === ConditionType.SHOW) {
            currentEvalState[key].visible = output;
          }
        });
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
): any {
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
  payload: any,
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
      payload.editorConfig.forEach((config: any) => {
        generateInitialEvalState(config);
      });
    }

    // Then the form config is extracted from the settings json
    if (
      "settingConfig" in payload &&
      !!payload.settingConfig &&
      payload.settingConfig.length > 0
    ) {
      payload.settingConfig.forEach((config: any) => {
        generateInitialEvalState(config);
      });
    }

    // This is the initial evaluation state, evaluations can now be run on top of this
    return { [payload.formId]: finalEvalObj };
  } else {
    const { actionConfiguration, formId } = payload;
    // In case the formData is not ready or the form is not of type UQI, return empty state
    if (!actionConfiguration.formData) {
      return currentEvalState;
    } else {
      return getFormEvaluation(formId, actionConfiguration, currentEvalState);
    }
  }
}
