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
  setObjectAtPosition,
  getThenCatchBlocksFromQuery,
  setThenBlockInQuery,
  setCatchBlockInQuery,
} from "@shared/ast";
import { TreeDropdownOption } from "design-system-old";
import { ActionTree, CallbackBlock } from "./types";
import { AppsmithFunction } from "./constants";
import { FIELD_GROUP_CONFIG } from "./FieldGroup/FieldGroupConfig";

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);
  return stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `'${segment}'`;
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
  const requiredValue = getCodeFromMoustache(currentValue);
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
  const requiredValue = getCodeFromMoustache(value);
  return getModalName(requiredValue, self.evaluationVersion);
};

export const objectSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const requiredValue = getCodeFromMoustache(currentValue);
  const changeValueWithoutBraces = getCodeFromMoustache(changeValue);
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
  const changeValueWithoutBraces = getCodeFromMoustache(
    stringToJS(changeValue),
  );
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
        return `{{${setCallbackFunctionField(
          requiredValue,
          changeValueWithoutBraces,
          argNum,
          self.evaluationVersion,
        ) || currentValue}}}`;
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
  const requiredValue = getCodeFromMoustache(currentValue);
  const requiredChangeValue = getCodeFromMoustache(changeValue) || "() => {}";
  try {
    return `{{${setCallbackFunctionField(
      requiredValue,
      requiredChangeValue,
      argNum,
      self.evaluationVersion,
    ) || currentValue}}}`;
  } catch (e) {
    // showError();
    throw e;
  }
};

export const callBackFieldGetter = (value: string, argNumber = 0) => {
  const requiredValue = getCodeFromMoustache(value);
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
  const jsCode = getCodeFromMoustache(code);

  const selectedOption = getSelectedFieldFromValue(jsCode, fieldOptions);

  const mainActionType = (selectedOption.type ||
    selectedOption.value ||
    AppsmithFunction.none) as any;

  if (
    [AppsmithFunction.integration].includes(mainActionType) &&
    multipleActions
  ) {
    const successCallback = getFuncExpressionAtPosition(
      jsCode,
      0,
      self.evaluationVersion,
    );
    const { catch: catchBlock, then: thenBlock } = getThenCatchBlocksFromQuery(
      code,
      self.evaluationVersion,
    );

    const thenCallbackBlocks = getFunctionBodyStatements(
      thenBlock,
      self.evaluationVersion,
    );

    const catchCallbackBlocks = getFunctionBodyStatements(
      catchBlock,
      self.evaluationVersion,
    );

    const successCallbackBlocks: string[] = getFunctionBodyStatements(
      successCallback,
      self.evaluationVersion,
    ).map((block: string) => block);

    const errorCallback = getFuncExpressionAtPosition(
      jsCode,
      1,
      self.evaluationVersion,
    );
    const errorCallbackBlocks = getFunctionBodyStatements(
      errorCallback,
      self.evaluationVersion,
    ).map((block: string) => block);

    return {
      // code: getMainAction(jsCode, self.evaluationVersion),
      code: jsCode,
      actionType: mainActionType,
      successBlocks: [
        ...successCallbackBlocks.map(
          (block) =>
            ({
              ...codeToAction(block, fieldOptions, false),
              type: "success",
            } as CallbackBlock),
        ),
        ...thenCallbackBlocks.map(
          (block) =>
            ({
              ...codeToAction(block, fieldOptions, false),
              type: "then",
            } as CallbackBlock),
        ),
      ],
      errorBlocks: [
        ...errorCallbackBlocks.map(
          (block) =>
            ({
              ...codeToAction(block, fieldOptions, false),
              type: "failure",
            } as CallbackBlock),
        ),
        ...catchCallbackBlocks.map(
          (block) =>
            ({
              ...codeToAction(block, fieldOptions, false),
              type: "catch",
            } as CallbackBlock),
        ),
      ],
    };
  }

  return {
    code: jsCode,
    actionType: mainActionType,
    successBlocks: [],
    errorBlocks: [],
  };
}

export function actionToCode(
  action: ActionTree,
  multipleActions = true,
): string {
  const { actionType, code, errorBlocks, successBlocks } = action;

  const actionFieldConfig = FIELD_GROUP_CONFIG[actionType];

  if (!actionFieldConfig) {
    return code;
  }

  if (
    [AppsmithFunction.integration].includes(actionType as any) &&
    multipleActions
  ) {
    const successCallbackCodes = successBlocks
      .filter(
        ({ actionType, type }) =>
          actionType !== AppsmithFunction.none && type === "success",
      )
      .map((callback) => actionToCode(callback, false));
    const successCallbackCode = successCallbackCodes.join("");

    const thenCallbackCodes = successBlocks
      .filter(
        ({ actionType, type }) =>
          actionType !== AppsmithFunction.none && type === "then",
      )
      .map((callback) => actionToCode(callback, false));
    const thenCallbackCode = thenCallbackCodes.join("");

    const errorCallbackCodes = errorBlocks
      .filter(
        ({ actionType, type }) =>
          actionType !== AppsmithFunction.none && type === "failure",
      )
      .map((callback) => actionToCode(callback, false));
    const errorCallbackCode = errorCallbackCodes.join("");

    const catchCallbackCodes = errorBlocks
      .filter(
        ({ actionType, type }) =>
          actionType !== AppsmithFunction.none && type === "catch",
      )
      .map((callback) => actionToCode(callback, false));
    const catchCallbackCode = catchCallbackCodes.join("");

    // Set callback function field only if there is a callback code
    const withSuccessCallback = successCallbackCode
      ? setCallbackFunctionField(
          code,
          `() => { ${successCallbackCode} }`,
          0,
          self.evaluationVersion,
        )
      : code;

    const withThenCallback = setThenBlockInQuery(
      withSuccessCallback,
      `() => { ${thenCallbackCode} }`,
      self.evaluationVersion,
    );

    // Set callback function field only if there is a callback code
    const withErrorCallback = errorCallbackCode
      ? setCallbackFunctionField(
          withThenCallback,
          `() => { ${errorCallbackCode} }`,
          1,
          self.evaluationVersion,
        )
      : withThenCallback;

    const withCatchCallback = setCatchBlockInQuery(
      withErrorCallback,
      `() => { ${catchCallbackCode} }`,
      self.evaluationVersion,
    );

    return withCatchCallback;
  }

  return code === "" || code.endsWith(";") ? code : code + ";";
}

export function isEmptyBlock(block: string) {
  return [";", "undefined;", ""].includes(getCodeFromMoustache(block));
}

/** {{Hello {{Input.text}}}} -> Hello {{Input.text}} */
export function getCodeFromMoustache(value = "") {
  const code = value.replace(/^{{|}}$/g, "");
  return code;
}
