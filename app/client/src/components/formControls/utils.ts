import { isBoolean, get, map, set } from "lodash";
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

export const getConfigInitialValues = (config: Record<string, any>[]) => {
  const configInitialValues = {};
  if (!Array.isArray(config)) return configInitialValues;

  const parseConfig = (section: any): any => {
    return map(section.children, (subSection: any) => {
      if ("children" in subSection) {
        return parseConfig(subSection);
      }

      if ("initialValue" in subSection) {
        if (subSection.controlType === "KEYVALUE_ARRAY") {
          subSection.initialValue.forEach(
            (initialValue: string | number, index: number) => {
              const configProperty = subSection.configProperty.replace(
                "*",
                index,
              );

              set(configInitialValues, configProperty, initialValue);
            },
          );
        } else {
          set(
            configInitialValues,
            subSection.configProperty,
            subSection.initialValue,
          );
        }
      }
    });
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
