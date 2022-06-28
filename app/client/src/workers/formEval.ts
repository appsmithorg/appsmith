import {
  DynamicValues,
  EvaluatedFormConfig,
  FormEvalOutput,
  FormEvaluationState,
  FormConfigEvalObject,
  DynamicValuesConfig,
} from "reducers/evaluationReducers/formEvaluationReducer";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { ActionConfig } from "entities/Action";
import { FormEvalActionPayload } from "sagas/FormEvaluationSaga";
import { FormConfigType } from "components/formControls/BaseControl";
import { isArray, isEmpty, isString, merge, uniq } from "lodash";
import { extractEvalConfigFromFormConfig } from "components/formControls/utils";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { isTrueObject } from "./evaluationUtils";

export enum ConditionType {
  HIDE = "hide", // When set, the component will be shown until condition is true
  SHOW = "show", // When set, the component will be hidden until condition is true
  ENABLE = "enable", // When set, the component will be enabled until condition is true
  DISABLE = "disable", // When set, the component will be disabled until condition is true
  FETCH_DYNAMIC_VALUES = "fetchDynamicValues", // When set, the component will fetch the values dynamically
  EVALUATE_FORM_CONFIG = "evaluateFormConfig", // When set, the component will evaluate the form config settings
}

export enum FormDataPaths {
  COMMAND = "actionConfiguration.formData.command.data",
  ENTITY_TYPE = "actionConfiguration.formData.entityType.data",
}

// Object to hold the initial eval object
let finalEvalObj: FormEvalOutput;

// This variable, holds an array of strings that represent the path for the evalConfigs.
// This path os used to configure the evalFormConfig objects for various form configs
let evalConfigPaths: string[] = [];

// This regex matches the config property string up to countless places.
export const MATCH_ACTION_CONFIG_PROPERTY = /\b(actionConfiguration\.\w+.(?:(\w+.)){1,})\b/g;
export function matchExact(r: RegExp, str: string) {
  const match = str.match(r);
  return match || [];
}

// Recursive function to generate the evaluation state for form config
const generateInitialEvalState = (formConfig: FormConfigType) => {
  const conditionals: Record<string, any> = {};
  const conditionTypes: Record<string, any> = {};
  let dependencyPaths: string[] = [];

  // // Any element is only added to the eval state if they have a conditional statement present, if not they are allowed to be rendered
  // if ("conditionals" in formConfig && !!formConfig.conditionals) {
  let key = "unknowns";

  // A unique key is used to refer the object in the eval state, can be propertyName, configProperty or identifier
  if ("propertyName" in formConfig && !!formConfig.propertyName) {
    key = formConfig.propertyName;
  } else if ("configProperty" in formConfig && !!formConfig.configProperty) {
    key = formConfig.configProperty;
  } else if ("identifier" in formConfig && !!formConfig.identifier) {
    key = formConfig.identifier;
  }

  // Any element is only added to the eval state if they have a conditional statement present, if not they are allowed to be rendered
  if ("conditionals" in formConfig && !!formConfig.conditionals) {
    const allConditionTypes = Object.keys(formConfig.conditionals);
    if (
      allConditionTypes.includes(ConditionType.HIDE) ||
      allConditionTypes.includes(ConditionType.SHOW)
    ) {
      conditionTypes.visible = false;
      merge(conditionals, formConfig.conditionals);

      const showOrHideDependencies = matchExact(
        MATCH_ACTION_CONFIG_PROPERTY,
        formConfig.conditionals?.show || formConfig.conditionals?.hide || "",
      );

      dependencyPaths = [...dependencyPaths, ...showOrHideDependencies];
    }

    if (
      allConditionTypes.includes(ConditionType.ENABLE) ||
      allConditionTypes.includes(ConditionType.DISABLE)
    ) {
      conditionTypes.enabled = true;
      merge(conditionals, formConfig.conditionals);

      const enableOrDisableDependencies = matchExact(
        MATCH_ACTION_CONFIG_PROPERTY,
        formConfig.conditionals?.enable ||
          formConfig.conditionals?.disable ||
          "",
      );

      dependencyPaths = [...dependencyPaths, ...enableOrDisableDependencies];
    }

    // if (allConditionTypes.includes(ConditionType.EVALUATE_FORM_CONFIG)) {
    //   // Setting the component as invisible since it has elements that will be evaluated later
    //   conditionTypes.visible = false;
    //   const evaluateFormConfig: EvaluatedFormConfig = {
    //     updateEvaluatedConfig: false,
    //     paths: formConfig.conditionals.evaluateFormConfig.paths,
    //     evaluateFormConfigObject: extractEvalConfigFromFormConfig(
    //       formConfig,
    //       formConfig.conditionals.evaluateFormConfig.paths,
    //     ),
    //   };
    //   conditionTypes.evaluateFormConfig = evaluateFormConfig;
    //   conditionals.evaluateFormConfig =
    //     formConfig.conditionals.evaluateFormConfig.condition;
    // }

    if (allConditionTypes.includes(ConditionType.FETCH_DYNAMIC_VALUES)) {
      const fetchDynamicValuesDependencies = matchExact(
        MATCH_ACTION_CONFIG_PROPERTY,
        formConfig.conditionals?.fetchDynamicValues?.condition || "",
      );
      let dynamicDependencyPathList: Set<string> | undefined;

      if (fetchDynamicValuesDependencies.length > 0) {
        dynamicDependencyPathList = new Set(fetchDynamicValuesDependencies);
      } else {
        dynamicDependencyPathList = undefined;
      }

      const dynamicValues: DynamicValues = {
        allowedToFetch: false,
        isLoading: false,
        hasStarted: false,
        hasFetchFailed: false,
        data: [],
        config: formConfig.conditionals.fetchDynamicValues.config,
        dynamicDependencyPathList,
        evaluatedConfig: { params: {} },
      };
      conditionTypes.fetchDynamicValues = dynamicValues;
      conditionals.fetchDynamicValues =
        formConfig.conditionals.fetchDynamicValues.condition;
    }

    // make the evalConfigPaths empty before calling the generateFormEvalFormConfigPaths
    // this is helpful since we are iterating through the form configs and we do not want to store the value of a
    // prev form config into another one.
    evalConfigPaths = [];

    // recursively generate the paths for form cofigs that need evalFormConfig.
    // and we store them in the evalFormFonfig
    generateEvalFormConfigPaths(formConfig);

    // we generate a unique array of paths, if the paths are greater than 0,
    // we generate and add the evaluateFormConfig object to the current formConfig.
    if (uniq(evalConfigPaths).length > 0) {
      conditionTypes.visible = false;
      const evaluateFormConfig: EvaluatedFormConfig = {
        updateEvaluatedConfig: false,
        paths: uniq(evalConfigPaths),
        evaluateFormConfigObject: extractEvalConfigFromFormConfig(
          formConfig,
          uniq(evalConfigPaths),
        ),
      };
      conditionTypes.evaluateFormConfig = evaluateFormConfig;
      conditionals.evaluateFormConfig = "{{true}}";
    }
  }

  // keep the configProperty in the formConfig values.
  let configPropertyPath;
  if (!!formConfig.configProperty) {
    configPropertyPath = formConfig.configProperty;
  }

  let staticDependencyPathList: Set<string> | undefined;

  if (dependencyPaths.length > 0) {
    staticDependencyPathList = new Set(dependencyPaths);
  } else {
    staticDependencyPathList = undefined;
  }

  // Conditionals are stored in the eval state itself for quick access
  finalEvalObj[key] = {
    ...conditionTypes,
    conditionals,
    configPropertyPath,
    staticDependencyPathList,
  };

  if ("children" in formConfig && !!formConfig.children)
    formConfig.children.forEach((config: FormConfigType) =>
      generateInitialEvalState(config),
    );

  if ("schema" in formConfig && !!formConfig.schema)
    formConfig.schema.forEach((config: FormConfigType) =>
      generateInitialEvalState({ ...config }),
    );
};

// The idea here is to recursively go through each of the key value pairs of the current form config
// then we check if the form config or its children/options/schemas have dynamic values
// if the children/options/schemas have dynamic values within them, we add the key name of the parent to the evalFormConfigPaths
// this might sound strange but we add the evaluateFormConfig property to the parent.
// this is why we pass the parent key into the function and use it to update the evalFormConfig.
function generateEvalFormConfigPaths(
  formConfig: FormConfigType,
  parentKey = "",
) {
  // this stores all the paths for the current form config,
  // we then use this path to update the evalFormConfig array with the parent
  const paths: string[] = [];
  // we never check the conditionals object, or the placeholderText.
  // we also never check children and schema cause the recursive function that this function is called in already checks the children and schemas (to prevent double recursive checks).
  // the second placeHolderText is due to a rogue value in the formConfig of one of S3 datasource form config.
  const configToBeChecked = {
    ...formConfig,
    conditionals: undefined,
    children: undefined,
    schema: undefined,
    placeholderText: undefined,
    placeHolderText: undefined,
  };

  Object.entries(configToBeChecked).forEach(([key, value]) => {
    // we check if the current value for the key is a dynamic value, if yes, we push the current key into our paths array.
    if (!!value) {
      if (isString(value)) {
        if (isDynamicValue(value)) {
          paths.push(key);
          // if parent key is empty, then there is a very good chance it's coming from the root form config.
          // and in that case we can just set it to it.
          if (!parentKey) parentKey = key;
        }
      }

      // if it's an array, we run it recursively on the array values.
      if (isArray(value)) {
        value.forEach((val) => {
          generateEvalFormConfigPaths(val, key);
        });
      }

      // if it is an object, we do the same.
      if (isTrueObject(value as FormConfigType)) {
        generateEvalFormConfigPaths(value, key);
      }
    }
  });

  // if the path array is greater than one, we update the evalConfigPaths with parent key.
  if (paths.length > 0) {
    evalConfigPaths.push(parentKey);
  }
}

function evaluateDynamicValuesConfig(
  actionConfiguration: ActionConfig,
  config: Record<string, any>,
) {
  const evaluatedConfig: Record<string, any> = { ...config };
  const configArray = Object.entries(config);
  if (configArray.length > 0) {
    configArray.forEach(([key, value]) => {
      if (typeof value === "object") {
        evaluatedConfig[key] = evaluateDynamicValuesConfig(
          actionConfiguration,
          value,
        );
      } else if (typeof value === "string" && value.length > 0) {
        if (isDynamicValue(value)) {
          let evaluatedValue = "";
          try {
            evaluatedValue = eval(value);
          } catch (e) {
            evaluatedValue = "error";
          } finally {
            evaluatedConfig[key] = evaluatedValue;
          }
        }
      }
    });
  }
  return evaluatedConfig;
}

function evaluateFormConfigElements(
  actionConfiguration: ActionConfig,
  config: FormConfigEvalObject,
) {
  const paths = Object.keys(config);
  if (paths.length > 0) {
    paths.forEach((path) => {
      const { expression } = config[path];
      try {
        const evaluatedVal = eval(expression);
        config[path].output = evaluatedVal;
      } catch (e) {}
    });
  }
  return config;
}

// Function to run the eval for the whole form when data changes
function evaluate(
  actionConfiguration: ActionConfig,
  currentEvalState: FormEvalOutput,
  actionDiffPath?: string,
  hasRouteChanged?: boolean,
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
            } else if (
              conditionType === ConditionType.FETCH_DYNAMIC_VALUES &&
              currentEvalState[key].hasOwnProperty("fetchDynamicValues") &&
              !!currentEvalState[key].fetchDynamicValues
            ) {
              // this boolean value represents if the current action diff path is a dependency to the form config.
              let isActionDiffADependency = false;

              // If the key in the currentEval state has dynamicDependencyPathList, we check to see if the path of the changed value
              // exists in the path list, if it does, we evaluate the dynamicValues and fetch the data via API call,
              // but if the value does not exist in the path list, we prevent the dynamic value from being refetched via API call.
              // in other words, if the current actionDiffPath is a dependency, then isActionDiffADependency becomes true.
              if (
                currentEvalState[key] &&
                !!currentEvalState[key]?.fetchDynamicValues
                  ?.dynamicDependencyPathList &&
                !isEmpty(
                  currentEvalState[key]?.fetchDynamicValues
                    ?.dynamicDependencyPathList,
                ) &&
                !!actionDiffPath &&
                currentEvalState[
                  key
                ]?.fetchDynamicValues?.dynamicDependencyPathList?.has(
                  actionDiffPath,
                )
              ) {
                isActionDiffADependency = true;
              }

              // if the actionDiffPath is a dependency or if the route has changed (navigated to another action/page) of if there's no actionDiffPath at all (when the page is refreshed)
              // we want to trigger an API call for the dynamic values.
              if (
                isActionDiffADependency ||
                !actionDiffPath ||
                hasRouteChanged
              ) {
                (currentEvalState[key]
                  .fetchDynamicValues as DynamicValues).allowedToFetch = output;
                (currentEvalState[key]
                  .fetchDynamicValues as DynamicValues).isLoading = output;
                (currentEvalState[key]
                  .fetchDynamicValues as DynamicValues).evaluatedConfig = evaluateDynamicValuesConfig(
                  actionConfiguration,
                  (currentEvalState[key].fetchDynamicValues as DynamicValues)
                    .config,
                ) as DynamicValuesConfig;
              } else {
                (currentEvalState[key]
                  .fetchDynamicValues as DynamicValues).allowedToFetch = false;
                (currentEvalState[key]
                  .fetchDynamicValues as DynamicValues).isLoading = false;
              }
            } else if (
              conditionType === ConditionType.EVALUATE_FORM_CONFIG &&
              currentEvalState[key].hasOwnProperty("evaluateFormConfig") &&
              !!currentEvalState[key].evaluateFormConfig
            ) {
              (currentEvalState[key]
                .evaluateFormConfig as EvaluatedFormConfig).updateEvaluatedConfig = output;
              currentEvalState[key].visible = output;
              if (output && !!currentEvalState[key].evaluateFormConfig)
                (currentEvalState[key]
                  .evaluateFormConfig as EvaluatedFormConfig).evaluateFormConfigObject = evaluateFormConfigElements(
                  actionConfiguration,
                  (currentEvalState[key]
                    .evaluateFormConfig as EvaluatedFormConfig)
                    .evaluateFormConfigObject,
                );
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
  actionDiffPath?: string,
  hasRouteChanged?: boolean,
): FormEvaluationState {
  // Only change the form evaluation state if the form ID is same or the evaluation state is present
  if (!!currentEvalState && currentEvalState.hasOwnProperty(formId)) {
    const currentFormIdEvalState = currentEvalState[formId];
    // specific conditions to be evaluated
    let conditionToBeEvaluated = {};
    // dynamic conditions always need evaluations
    let dynamicConditionsToBeFetched = {};
    for (const [key, value] of Object.entries(currentFormIdEvalState)) {
      if (
        value &&
        !!value.configPropertyPath &&
        !!actionDiffPath &&
        actionDiffPath?.includes(value.configPropertyPath)
      ) {
        conditionToBeEvaluated = { ...conditionToBeEvaluated, [key]: value };
      }

      // static dependency pathlist should be a key of identifiers that point to formControls that are dependent on the result of the current form config value.
      // it is important to note the difference between staticDependencyPathList and dynamicDependencyPathList is that the former is for formConfigs that don't require API calls.
      // they are mostly layout based i.e. show/hide, enable/disable
      if (!!value.staticDependencyPathList && !!actionDiffPath) {
        value.staticDependencyPathList.forEach(() => {
          if (value.staticDependencyPathList?.has(actionDiffPath)) {
            conditionToBeEvaluated = {
              ...conditionToBeEvaluated,
              [key]: value,
            };
          }
        });
      }

      // if there are dynamic values present, add them to the condition to be evaluated.
      if (value && (!!value.fetchDynamicValues || !!value.evaluateFormConfig)) {
        dynamicConditionsToBeFetched = {
          ...dynamicConditionsToBeFetched,
          [key]: value,
        };
      }
    }

    // if no condition is to be evaluated or if the currently changing action diff path is the command path
    // then we run evaluations on the whole form.
    if (
      isEmpty(conditionToBeEvaluated) ||
      actionDiffPath === FormDataPaths.COMMAND
    ) {
      conditionToBeEvaluated = evaluate(
        actionConfiguration,
        currentEvalState[formId],
        actionDiffPath,
        hasRouteChanged,
      );
    } else {
      conditionToBeEvaluated = {
        ...conditionToBeEvaluated,
        ...dynamicConditionsToBeFetched,
      };
      conditionToBeEvaluated = evaluate(
        actionConfiguration,
        conditionToBeEvaluated,
        actionDiffPath,
        hasRouteChanged,
      );
    }

    currentEvalState[formId] = {
      ...currentEvalState[formId],
      ...conditionToBeEvaluated,
    };
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
      payload.editorConfig.forEach((config: FormConfigType) => {
        generateInitialEvalState(config);
      });
    }

    // Then the form config is extracted from the settings json
    if (
      "settingConfig" in payload &&
      !!payload.settingConfig &&
      payload.settingConfig.length > 0
    ) {
      payload.settingConfig.forEach((config: FormConfigType) => {
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
    const {
      actionConfiguration,
      actionDiffPath,
      formId,
      hasRouteChanged,
    } = payload;
    // In case the formData is not ready or the form is not of type UQI, return empty state
    if (!actionConfiguration || !actionConfiguration.formData) {
      return currentEvalState;
    } else {
      return getFormEvaluation(
        formId,
        actionConfiguration,
        currentEvalState,
        actionDiffPath,
        hasRouteChanged,
      );
    }
  }
}
