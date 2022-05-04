import { DATA_BIND_REGEX_GLOBAL } from "constants/BindingsConstants";
import { isBoolean, get, set } from "lodash";
import {
  ConditionalOutput,
  FormConfigEvalObject,
  FormEvalOutput,
} from "reducers/evaluationReducers/formEvaluationReducer";
import { isString } from "lodash";
import { FormConfigType, HiddenType } from "./BaseControl";

export const evaluateCondtionWithType = (
  conditions: Array<boolean> | undefined,
  type: string | undefined,
) => {
  if (conditions) {
    let flag;
    //this is where each conditions gets evaluated
    if (conditions.length > 1) {
      if (type === "AND") {
        flag = conditions.reduce((acc: any, item: boolean) => {
          return acc && item;
        }, conditions[0]);
      } else if (type === "OR") {
        flag = conditions.reduce((acc: any, item: boolean) => {
          return acc || item;
        }, undefined);
      }
    } else {
      flag = conditions[0];
    }
    return flag;
  }
};

export const isHiddenConditionsEvaluation = (
  values: any,
  hidden?: HiddenType,
): any => {
  if (!!hidden && !isBoolean(hidden)) {
    //if nested condtions are there recursively from bottom to top call this function on each condtion
    let conditionType, conditions;
    if ("conditionType" in hidden) {
      conditionType = hidden.conditionType;
    }
    if ("conditions" in hidden) {
      conditions = hidden.conditions;
    }
    if (Array.isArray(conditions)) {
      conditions = conditions.map((rule: any) => {
        return isHiddenConditionsEvaluation(values, rule);
      });
    } else {
      return caculateIsHidden(values, hidden);
    }
    return evaluateCondtionWithType(conditions, conditionType);
  }
};

export const caculateIsHidden = (values: any, hiddenConfig?: HiddenType) => {
  if (!!hiddenConfig && !isBoolean(hiddenConfig)) {
    let valueAtPath;
    let value, comparison;
    if ("path" in hiddenConfig) {
      valueAtPath = get(values, hiddenConfig.path);
    }
    if ("value" in hiddenConfig) {
      value = hiddenConfig.value;
    }
    if ("comparison" in hiddenConfig) {
      comparison = hiddenConfig.comparison;
    }

    switch (comparison) {
      case "EQUALS":
        return valueAtPath === value;
      case "NOT_EQUALS":
        return valueAtPath !== value;
      case "GREATER":
        return valueAtPath > value;
      case "LESSER":
        return valueAtPath < value;
      case "IN":
        return Array.isArray(value) && value.includes(valueAtPath);
      case "NOT_IN":
        return Array.isArray(value) && !value.includes(valueAtPath);
      default:
        return true;
    }
  }
};

export const isHidden = (values: any, hiddenConfig?: HiddenType) => {
  if (!!hiddenConfig && !isBoolean(hiddenConfig)) {
    if ("conditionType" in hiddenConfig) {
      //check if nested conditions exist
      return isHiddenConditionsEvaluation(values, hiddenConfig);
    } else {
      return caculateIsHidden(values, hiddenConfig);
    }
  }
  return !!hiddenConfig;
};

export enum ViewTypes {
  JSON = "json",
  COMPONENT = "component",
}

export const alternateViewTypeInputConfig = (controlType: string) => {
  const controlTypesForFullWidth = ["WHERE_CLAUSE", "SORTING"];
  return {
    label: "",
    isValid: true,
    controlType: controlTypesForFullWidth.includes(controlType)
      ? "QUERY_DYNAMIC_TEXT"
      : "QUERY_DYNAMIC_INPUT_TEXT",
    evaluationSubstitutionType: "TEMPLATE",
    // inputType: "JSON",
    inputType: "TEXT",
    showLineNumbers: true,
  };
};

export const getViewType = (values: any, configProperty: string) => {
  if (
    configProperty.startsWith("actionConfiguration.formData") &&
    configProperty.endsWith(".data")
  ) {
    const pathForViewType = configProperty.replace(".data", ".viewType");
    return get(values, pathForViewType, ViewTypes.COMPONENT);
  } else {
    return ViewTypes.COMPONENT;
  }
};

export const switchViewType = (
  values: any,
  configProperty: string,
  viewType: string,
  formName: string,
  changeFormValue: (formName: string, path: string, value: any) => void,
) => {
  const newViewType =
    viewType === ViewTypes.JSON ? ViewTypes.COMPONENT : ViewTypes.JSON;
  const pathForJsonData = configProperty.replace(".data", ".jsonData");
  const pathForComponentData = configProperty.replace(
    ".data",
    ".componentData",
  );
  const jsonData = get(values, pathForJsonData);
  const componentData = get(values, pathForComponentData);
  const currentData = get(values, configProperty);

  if (newViewType === ViewTypes.JSON) {
    changeFormValue(formName, pathForComponentData, currentData);
    if (!!jsonData) {
      changeFormValue(formName, configProperty, jsonData);
    } else {
      changeFormValue(
        formName,
        configProperty,
        isString(currentData)
          ? currentData
          : JSON.stringify(currentData, null, "\t"),
      );
    }
  } else {
    changeFormValue(formName, pathForJsonData, currentData);
    if (!!componentData) {
      changeFormValue(formName, configProperty, componentData);
    }
  }

  changeFormValue(
    formName,
    configProperty.replace(".data", ".viewType"),
    newViewType,
  );
};

// Function that extracts the initial value from the JSON configs
export const getConfigInitialValues = (
  config: Record<string, any>[],
  multipleViewTypesSupported = false,
) => {
  const configInitialValues: Record<string, any> = {};

  // We expect the JSON configs to be an array of objects
  if (!Array.isArray(config)) return configInitialValues;

  // Function to loop through the configs and extract the initial values
  const parseConfig = (section: any): any => {
    if ("initialValue" in section) {
      if (section.controlType === "KEYVALUE_ARRAY") {
        section.initialValue.forEach(
          (initialValue: string | number, index: number) => {
            const configProperty = section.configProperty.replace("*", index);

            set(configInitialValues, configProperty, initialValue);
          },
        );
      } else {
        set(configInitialValues, section.configProperty, section.initialValue);
      }
    } else if (section.controlType === "WHERE_CLAUSE") {
      let logicalTypes = [];
      if ("logicalTypes" in section && section.logicalTypes.length > 0) {
        logicalTypes = section.logicalTypes;
      } else {
        logicalTypes = [
          {
            label: "OR",
            value: "OR",
          },
          {
            label: "AND",
            value: "AND",
          },
        ];
      }
      set(
        configInitialValues,
        `${section.configProperty}.condition`,
        logicalTypes[0].value,
      );
      if (
        multipleViewTypesSupported &&
        section.configProperty.includes(".data")
      ) {
        set(
          configInitialValues,
          section.configProperty.replace(".data", ".viewType"),
          "component",
        );
        set(
          configInitialValues,
          section.configProperty.replace(".data", ".componentData.condition"),
          logicalTypes[0].value,
        );
      }
    }
    if ("children" in section) {
      section.children.forEach((childSection: any) => {
        parseConfig(childSection);
      });
    } else if ("schema" in section) {
      section.schema.forEach((childSection: any) => {
        parseConfig(childSection);
      });
    } else if (
      "configProperty" in section &&
      multipleViewTypesSupported &&
      section.configProperty.includes(".data")
    ) {
      set(
        configInitialValues,
        section.configProperty.replace(".data", ".viewType"),
        "component",
      );
      if (section.configProperty in configInitialValues) {
        set(
          configInitialValues,
          section.configProperty.replace(".data", ".componentData"),
          configInitialValues[section.configProperty],
        );
      }
    }
  };

  config.forEach((section: any) => {
    parseConfig(section);
  });

  return configInitialValues;
};

export const actionPathFromName = (
  actionName: string,
  name: string,
): string => {
  const ActionConfigStarts = "actionConfiguration.";
  let path = name;
  if (path.startsWith(ActionConfigStarts)) {
    path = "config." + path.slice(ActionConfigStarts.length);
  }
  return `${actionName}.${path}`;
};

export enum PaginationSubComponent {
  Limit = "limit",
  Offset = "offset",
}

export enum SortingSubComponent {
  Column = "column",
  Order = "order",
}

export enum WhereClauseSubComponent {
  Condition = "condition",
  Children = "children",
  Key = "key",
  Value = "value",
}

export const allowedControlTypes = ["DROP_DOWN", "QUERY_DYNAMIC_INPUT_TEXT"];

const extractExpressionObject = (
  config: string,
  path: any,
  parentPath: string,
) => {
  const bindingPaths: FormConfigEvalObject = {};
  const expressions = config.match(DATA_BIND_REGEX_GLOBAL);
  if (Array.isArray(expressions) && expressions.length > 0) {
    const completePath = parentPath.length > 0 ? `${parentPath}.${path}` : path;
    expressions.forEach((exp) => {
      bindingPaths[completePath] = {
        expression: exp,
        output: "",
      };
    });
  }
  return bindingPaths;
};

export const extractEvalConfigFromFormConfig = (
  formConfig: FormConfigType,
  paths: string[],
  parentPath = "",
  bindingsFound: FormConfigEvalObject = {},
) => {
  paths.forEach((path: string) => {
    if (!(path in formConfig)) return;
    const config = get(formConfig, path, "");
    if (typeof config === "string") {
      bindingsFound = {
        ...bindingsFound,
        ...extractExpressionObject(config, path, parentPath),
      };
    } else if (typeof config === "object") {
      bindingsFound = {
        ...bindingsFound,
        ...extractEvalConfigFromFormConfig(
          config,
          Object.keys(config),
          parentPath.length > 0 ? `${parentPath}.${path}` : path,
          bindingsFound,
        ),
      };
    }
  });

  return bindingsFound;
};

// Extract the output of conditionals attached to the form from the state
export const extractConditionalOutput = (
  section: any,
  formEvaluationState: FormEvalOutput,
): ConditionalOutput => {
  let conditionalOutput: ConditionalOutput = {};
  if (
    section.hasOwnProperty("propertyName") &&
    formEvaluationState.hasOwnProperty(section.propertyName)
  ) {
    conditionalOutput = formEvaluationState[section.propertyName];
  } else if (
    section.hasOwnProperty("configProperty") &&
    formEvaluationState.hasOwnProperty(section.configProperty)
  ) {
    conditionalOutput = formEvaluationState[section.configProperty];
  } else if (
    section.hasOwnProperty("identifier") &&
    !!section.identifier &&
    formEvaluationState.hasOwnProperty(section.identifier)
  ) {
    conditionalOutput = formEvaluationState[section.identifier];
  }
  return conditionalOutput;
};

// Function to check if the section config is allowed to render (Only for UQI forms)
export const checkIfSectionCanRender = (
  conditionalOutput: ConditionalOutput,
) => {
  // By default, allow the section to render. This is to allow for the case where no conditional is provided.
  // The evaluation state disallows the section to render if the condition is not met. (Checkout formEval.ts)
  let allowToRender = true;
  if (
    conditionalOutput.hasOwnProperty("visible") &&
    typeof conditionalOutput.visible === "boolean"
  ) {
    allowToRender = conditionalOutput.visible;
  }

  if (
    conditionalOutput.hasOwnProperty("evaluateFormConfig") &&
    !!conditionalOutput.evaluateFormConfig &&
    conditionalOutput.evaluateFormConfig.hasOwnProperty(
      "updateEvaluatedConfig",
    ) &&
    typeof conditionalOutput.evaluateFormConfig.updateEvaluatedConfig ===
      "boolean"
  ) {
    allowToRender = conditionalOutput.evaluateFormConfig.updateEvaluatedConfig;
  }
  return allowToRender;
};

// Function to check if the section config is enabled (Only for UQI forms)
export const checkIfSectionIsEnabled = (
  conditionalOutput: ConditionalOutput,
) => {
  // By default, the section is enabled. This is to allow for the case where no conditional is provided.
  // The evaluation state disables the section if the condition is not met. (Checkout formEval.ts)
  let enabled = true;
  if (
    conditionalOutput.hasOwnProperty("enabled") &&
    typeof conditionalOutput.enabled === "boolean"
  ) {
    enabled = conditionalOutput.enabled;
  }
  return enabled;
};

// Function to modify the section config based on the output of evaluations
export const modifySectionConfig = (section: any, enabled: boolean): any => {
  if (!enabled) {
    section.disabled = true;
  } else {
    section.disabled = false;
  }

  return section;
};

export const updateEvaluatedSectionConfig = (
  section: any,
  conditionalOutput: ConditionalOutput,
  enabled = true,
) => {
  const updatedSection = { ...section };
  let evaluatedConfig: FormConfigEvalObject = {};
  if (
    conditionalOutput.hasOwnProperty("evaluateFormConfig") &&
    !!conditionalOutput.evaluateFormConfig &&
    conditionalOutput.evaluateFormConfig.hasOwnProperty(
      "updateEvaluatedConfig",
    ) &&
    typeof conditionalOutput.evaluateFormConfig.updateEvaluatedConfig ===
      "boolean" &&
    conditionalOutput.evaluateFormConfig.updateEvaluatedConfig
  ) {
    evaluatedConfig =
      conditionalOutput.evaluateFormConfig.evaluateFormConfigObject;

    const paths = Object.keys(evaluatedConfig);
    paths.forEach((path: string) => {
      set(updatedSection, path, evaluatedConfig[path].output);
    });
  }

  return modifySectionConfig(updatedSection, enabled);
};
