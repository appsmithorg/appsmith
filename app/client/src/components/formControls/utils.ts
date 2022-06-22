import { isBoolean, get, set } from "lodash";
import { HiddenType } from "./BaseControl";
import { diff, Diff } from "deep-diff";
import { MongoDefaultActionConfig } from "constants/DatasourceEditorConstants";
import { Action } from "@sentry/react/dist/types";

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

export const alternateViewTypeInputConfig = {
  label: "",
  isValid: true,
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  evaluationSubstitutionType: "TEMPLATE",
  inputType: "JSON",
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
      section.children.forEach((section: any) => {
        parseConfig(section);
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

export function fixActionPayloadForMongoQuery(
  action?: Action,
): Action | undefined {
  if (!action) return action;

  /* eslint-disable */
  //@ts-nocheck
  try {
    let actionObjectDiff: undefined | Diff<any, any>[] = diff(
      action,
      MongoDefaultActionConfig,
    );
    if (actionObjectDiff) {
      actionObjectDiff = actionObjectDiff.filter((diff) => diff.kind === "N");
      for (let i = 0; i < actionObjectDiff.length; i++) {
        let path = "";
        let value = "";
        //kind = N indicates a newly added property/element
        //This property is present in initialValues but not in action object
        if (
          actionObjectDiff &&
          actionObjectDiff[i].hasOwnProperty("kind") &&
          actionObjectDiff[i].path &&
          Array.isArray(actionObjectDiff[i].path) &&
          actionObjectDiff[i]?.path?.length &&
          actionObjectDiff[i]?.kind === "N"
        ) {
          // @ts-expect-error: Types are not available
          if (typeof actionObjectDiff[i]?.path[0] === "string") {
            // @ts-expect-error: Types are not available
            path = actionObjectDiff[i]?.path?.join(".");
          }
          // @ts-expect-error: Types are not available
          value = actionObjectDiff[i]?.rhs;
          // @ts-expect-error: Types are not available
          set(action, path, value);
        }
      }
    }
    return action;
    //@ts-check
  } catch (error) {
    console.error("Error adding default paths in Mongo query");
    return action;
  }
}
