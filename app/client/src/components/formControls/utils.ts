import { isBoolean, get, map, set } from "lodash";
import { HiddenType, hidden } from "./BaseControl";

export const isHiddenForArray = (hiddenConfig: any) => {
  if (!!hiddenConfig) {
    const valueAtPath = hiddenConfig.path;
    const value = hiddenConfig.value;

    switch (hiddenConfig.comparison) {
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
  return !!hiddenConfig;
};

export const evaluateCondtionsWithType = (conditions: any, type: string) => {
  let flag;
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
};

export const isHiddenEvaluation = (hidden: any) => {
  const conditionType = hidden.conditionType;
  let conditions = hidden.conditions;
  if (conditions) {
    conditions = conditions.map((rule: any) => {
      return isHiddenEvaluation(rule);
    });
  } else {
    return isHiddenForArray(hidden);
  }
  return evaluateCondtionsWithType(conditions, conditionType);
};

export const isHidden = (values: any, hiddenConfig?: HiddenType) => {
  console.log(isHiddenEvaluation(hidden));
  if (!!hiddenConfig && !isBoolean(hiddenConfig)) {
    const valueAtPath = get(values, hiddenConfig.path);
    const value = hiddenConfig.value;

    switch (hiddenConfig.comparison) {
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

      if (subSection.initialValue) {
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
