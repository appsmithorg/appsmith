import { ViewTypes } from "@appsmith/types";
import isBoolean from "lodash/isBoolean";
import get from "lodash/get";
import type { HiddenType } from "@appsmith/types";

export const getFormControlViewType = (
  values: unknown,
  configProperty: string,
) => {
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

export const calculateIsHidden = (
  values: unknown,
  hiddenConfig?: HiddenType,
  featureFlags?: Record<string, boolean>,
  viewMode?: boolean,
) => {
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
        return valueAtPath > (value as number);
      case "LESSER":
        return valueAtPath < (value as number);
      case "IN":
        return Array.isArray(value) && value.includes(valueAtPath);
      case "NOT_IN":
        return Array.isArray(value) && !value.includes(valueAtPath);
      case "FEATURE_FLAG":
        // FEATURE_FLAG comparision is used to hide previous configs,
        // and show new configs if feature flag is enabled, if disabled/ not present,
        // previous config would be shown as is
        const flagValue =
          "flagValue" in hiddenConfig ? hiddenConfig.flagValue : "";

        if (!flagValue) {
          return true;
        }

        return !!featureFlags && featureFlags[flagValue] === value;
      case "VIEW_MODE":
        // This can be used to decide which form controls to show in view mode or edit mode depending on the value.
        return viewMode === value;
      case "DEFINED_AND_NOT_EQUALS":
        return !!valueAtPath && valueAtPath !== value;
      default:
        return true;
    }
  }
};

export const evaluateCondtionWithType = (
  conditions: Array<boolean> | undefined,
  type: string | undefined,
) => {
  if (conditions) {
    let flag;
    //this is where each conditions gets evaluated
    if (conditions.length > 1) {
      if (type === "AND") {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        flag = conditions.reduce((acc: any, item: boolean) => {
          return acc && item;
        }, conditions[0]);
      } else if (type === "OR") {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any,
  hidden?: HiddenType,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conditions = conditions.map((rule: any) => {
        return isHiddenConditionsEvaluation(values, rule);
      });
    } else {
      return calculateIsHidden(values, hidden);
    }
    return evaluateCondtionWithType(conditions, conditionType);
  }
};

export const isFormControlHidden = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any,
  hiddenConfig?: HiddenType,
  featureFlags?: Record<string, boolean>,
  viewMode?: boolean,
) => {
  if (!!hiddenConfig && !isBoolean(hiddenConfig)) {
    if ("conditionType" in hiddenConfig) {
      //check if nested conditions exist
      return isHiddenConditionsEvaluation(values, hiddenConfig);
    } else {
      return calculateIsHidden(values, hiddenConfig, featureFlags, viewMode);
    }
  }
  return !!hiddenConfig;
};
