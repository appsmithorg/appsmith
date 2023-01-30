import { FUNC_ARGS_REGEX } from "./regex";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { isValidURL } from "utils/URLUtils";
import {
  getTextArgumentAtPosition,
  getEnumArgumentAtPosition,
  getModalName,
  setModalName,
  setTextArgumentAtPosition,
  setEnumArgumentAtPosition,
  setCallbackFunctionField,
  getFuncExpressionAtPosition,
  getFunctionBodyStatements,
  replaceActionInQuery,
  setObjectAtPosition,
} from "@shared/ast";
import { TreeDropdownOption } from "design-system";
import { ActionTree } from "./types";
import { AppsmithFunction } from "./constants";
import { FIELD_GROUP_CONFIG } from "./FieldGroup/FieldGroupConfig";

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);
  return stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `${segment}`;
      }
    })
    .join(" + ");
};

export const JSToString = (js: string): string => {
  const segments = js.split(" + ");
  return segments
    .map((segment) => {
      if (segment.charAt(0) === "'") {
        return segment.substring(1, segment.length - 1);
      } else return "{{" + segment + "}}";
    })
    .join("");
};

export const argsStringToArray = (funcArgs: string): string[] => {
  const argsplitMatches = [...funcArgs.matchAll(FUNC_ARGS_REGEX)];
  const arr: string[] = [];
  let isPrevUndefined = true;
  for (const match of argsplitMatches) {
    const matchVal = match[0];
    if (!matchVal || matchVal === "") {
      if (isPrevUndefined) {
        arr.push(matchVal);
      }
      isPrevUndefined = true;
    } else {
      isPrevUndefined = false;
      arr.push(matchVal);
    }
  }
  return arr;
};

export const modalSetter = (changeValue: any, currentValue: string) => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = stringToJS(currentValue);
  try {
    return setModalName(requiredValue, changeValue, self.evaluationVersion);
  } catch (e) {
    // showError();
    throw e;
  }
};

export const modalGetter = (value: string) => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = stringToJS(value);
  return getModalName(requiredValue, self.evaluationVersion);
};

export const objectSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const requiredValue = stringToJS(currentValue);
  const changeValueWithoutBraces = stringToJS(changeValue);
  try {
    return setObjectAtPosition(
      requiredValue,
      changeValueWithoutBraces,
      argNum,
      self.evaluationVersion,
    );
  } catch (e) {
    // showError();
    return currentValue;
  }
};

export const textSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const requiredValue = stringToJS(currentValue);
  const changeValueWithoutBraces = stringToJS(changeValue);
  let requiredChangeValue;
  if (changeValue.indexOf("{{") === -1) {
    // raw string values
    requiredChangeValue = changeValue;
  } else {
    try {
      // raw js values that are not strings
      requiredChangeValue = JSON.parse(changeValueWithoutBraces);
    } catch (e) {
      // code
      try {
        return (
          setCallbackFunctionField(
            requiredValue,
            changeValueWithoutBraces,
            argNum,
            self.evaluationVersion,
          ) || currentValue
        );
      } catch (e) {
        // showError();
        return currentValue;
      }
    }
  }

  try {
    return setTextArgumentAtPosition(
      requiredValue,
      requiredChangeValue,
      argNum,
      self.evaluationVersion,
    );
  } catch (e) {
    // showError();
    return currentValue;
  }
};

export const textGetter = (value: string, argNum: number): string => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = stringToJS(value);
  return getTextArgumentAtPosition(
    requiredValue,
    argNum,
    self.evaluationVersion,
  );
};

export const enumTypeSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(currentValue).jsSnippets[0];
  try {
    return setEnumArgumentAtPosition(
      requiredValue,
      changeValue,
      argNum,
      self.evaluationVersion,
    );
  } catch (e) {
    // showError();
    throw e;
  }
};

export const enumTypeGetter = (
  value: string,
  argNum: number,
  defaultValue = "",
): string => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(value).jsSnippets[0];
  return getEnumArgumentAtPosition(
    requiredValue,
    argNum,
    defaultValue,
    self.evaluationVersion,
  );
};

export const callBackFieldSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const requiredValue = stringToJS(currentValue);
  const requiredChangeValue = stringToJS(changeValue);
  try {
    return (
      setCallbackFunctionField(
        requiredValue,
        requiredChangeValue,
        argNum,
        self.evaluationVersion,
      ) || currentValue
    );
  } catch (e) {
    // showError();
    throw e;
  }
};

export const callBackFieldGetter = (value: string, argNumber = 0) => {
  const requiredValue = stringToJS(value);
  const funcExpr = getFuncExpressionAtPosition(
    requiredValue,
    argNumber,
    self.evaluationVersion,
  );
  return `{{${funcExpr}}}`;
};

/*
 * This function extracts the 1st string argument from value
 * and determines if the string is a valid url
 */
export const isValueValidURL = (value: string) => {
  if (value) {
    const indices = [];
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "'") {
        indices.push(i);
      }
    }
    const str = value.substring(indices[0], indices[1] + 1);
    return isValidURL(str);
  }
};

export function flattenOptions(
  options: TreeDropdownOption[],
  results: TreeDropdownOption[] = [],
): TreeDropdownOption[] {
  options.forEach((option) => {
    results.push(option);
    if (option.children) {
      flattenOptions(option.children, results);
    }
  });
  return results;
}

export function getSelectedFieldFromValue(
  value: string,
  fieldOptions: TreeDropdownOption[],
): TreeDropdownOption {
  const allOptions = flattenOptions(fieldOptions);

  const includedFields = allOptions.filter((option) => {
    return value.includes(option.value);
  });

  const matches = includedFields.map((option) => ({
    option,
    index: value.indexOf(option.value),
  }));

  const sortedMatches = matches.sort((a, b) => a.index - b.index);

  const selectedField = sortedMatches[0]?.option;

  const noActionFieldConfig = FIELD_GROUP_CONFIG[AppsmithFunction.none];
  const noActionOption: TreeDropdownOption = {
    label: noActionFieldConfig.label,
    value: noActionFieldConfig.value || "",
    children: noActionFieldConfig.children,
  };

  return selectedField || noActionOption;
}

export function codeToAction(
  code: string,
  fieldOptions: TreeDropdownOption[],
  multipleActions = true,
): ActionTree {
  const jsCode = stringToJS(code);

  const selectedOption = getSelectedFieldFromValue(jsCode, fieldOptions);

  const mainActionType = (selectedOption.type ||
    selectedOption.value ||
    AppsmithFunction.none) as any;

  if (
    [AppsmithFunction.runAPI, AppsmithFunction.integration].includes(
      mainActionType,
    ) &&
    multipleActions
  ) {
    const successCallbacks = getFuncExpressionAtPosition(
      jsCode,
      0,
      self.evaluationVersion,
    );
    const successCallbackBlocks: string[] = getFunctionBodyStatements(
      successCallbacks,
      self.evaluationVersion,
    ).map((block: string) => block);

    const errorCallbacks = getFuncExpressionAtPosition(
      jsCode,
      1,
      self.evaluationVersion,
    );
    const errorCallbackBlocks = getFunctionBodyStatements(
      errorCallbacks,
      self.evaluationVersion,
    ).map((block: string) => block);

    return {
      // code: getMainAction(jsCode, self.evaluationVersion),
      code: jsCode,
      actionType: mainActionType,
      successCallbacks: successCallbackBlocks.map((block) =>
        codeToAction(block, fieldOptions, false),
      ),
      errorCallbacks: errorCallbackBlocks.map((block: string) =>
        codeToAction(block, fieldOptions, false),
      ),
    };
  }

  return {
    code: jsCode,
    actionType: mainActionType,
    successCallbacks: [],
    errorCallbacks: [],
  };
}

export function actionToCode(
  action: ActionTree,
  multipleActions = true,
): string {
  const { actionType, code, errorCallbacks, successCallbacks } = action;

  const actionFieldConfig = FIELD_GROUP_CONFIG[actionType];

  if (!actionFieldConfig) {
    return code;
  }

  if (
    [AppsmithFunction.runAPI, AppsmithFunction.integration].includes(
      actionType as any,
    ) &&
    multipleActions
  ) {
    const successCallbackCodes = successCallbacks
      .filter(({ actionType }) => actionType !== AppsmithFunction.none)
      .map((callback) => actionToCode(callback, false));
    const successCallbackCode = successCallbackCodes.join("");

    const errorCallbackCodes = errorCallbacks
      .filter(({ actionType }) => actionType !== AppsmithFunction.none)
      .map((callback) => actionToCode(callback, false));
    const errorCallbackCode = errorCallbackCodes.join("");

    const withSuccessCallback = replaceActionInQuery(
      code,
      `() => { ${successCallbackCode} }`,
      0,
      self.evaluationVersion,
    );
    const withSuccessAndErrorCallback = replaceActionInQuery(
      withSuccessCallback,
      `() => { ${errorCallbackCode} }`,
      1,
      self.evaluationVersion,
    );

    return withSuccessAndErrorCallback;
  }

  return code === "" || code.endsWith(";") ? code : code + ";";
}
