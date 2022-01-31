import { isBoolean, get, set } from "lodash";
import { HiddenType } from "./BaseControl";

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

// Function that extracts the initial value from the JSON configs
export const getConfigInitialValues = (config: Record<string, any>[]) => {
  const configInitialValues = {};
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
      set(
        configInitialValues,
        `${section.configProperty}.condition`,
        section.logicalTypes[0].value,
      );
    }
    if ("children" in section) {
      section.children.forEach((section: any) => {
        parseConfig(section);
      });
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
    path = "config." + path.substr(ActionConfigStarts.length);
  }
  return `${actionName}.${path}`;
};
