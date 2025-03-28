import { FUNC_ARGS_REGEX } from "./regex";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { isValidURL, matchesURLPattern } from "utils/URLUtils";
import {
  getTextArgumentAtPosition,
  getEnumArgumentAtPosition,
  getModalName,
  setModalName,
  setEnumArgumentAtPosition,
  setCallbackFunctionField,
  getFuncExpressionAtPosition,
  getFunctionBodyStatements,
  setObjectAtPosition,
  getThenCatchBlocksFromQuery,
  setThenBlockInQuery,
  setCatchBlockInQuery,
  getFunctionParams,
  setQueryParam,
  getQueryParam,
  checkIfCatchBlockExists,
  checkIfThenBlockExists,
} from "@shared/ast";
import type { TreeDropdownOption } from "@appsmith/ads-old";
import type { TActionBlock } from "./types";
import { AppsmithFunction, DEFAULT_LABELS, FieldType } from "./constants";
import { FIELD_GROUP_CONFIG } from "./FieldGroup/FieldGroupConfig";
import store from "store";
import { selectEvaluationVersion } from "ee/selectors/applicationSelectors";
import { FIELD_CONFIG } from "./Field/FieldConfig";
import { setGenericArgAtPostition } from "@shared/ast/src/actionCreator";

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);

  return stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `'${segment.replace(/\n/g, "\\n").replace(/'/g, "\\'")}'`;
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

export function getEvaluationVersion() {
  const state = store.getState();

  return selectEvaluationVersion(state);
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const modalSetter = (changeValue: any, currentValue: string) => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getCodeFromMoustache(currentValue);

  try {
    return setModalName(requiredValue, changeValue, getEvaluationVersion());
  } catch (e) {
    // showError();
    throw e;
  }
};

export const modalGetter = (value: string) => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getCodeFromMoustache(value);

  return getModalName(requiredValue, getEvaluationVersion());
};

export const objectSetter = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      getEvaluationVersion(),
    );
  } catch (e) {
    return currentValue;
  }
};

export const textSetter = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const requiredValue = stringToJS(currentValue);
  const changeValueWithoutBraces = getCodeFromMoustache(
    stringToJS(changeValue),
  );

  try {
    return `{{${setCallbackFunctionField(
      requiredValue,
      changeValueWithoutBraces,
      argNum,
      getEvaluationVersion(),
    )}}}`;
  } catch (e) {
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
    getEvaluationVersion(),
  );
};

export const enumTypeSetter = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changeValue: any,
  currentValue: string,
  argNum: number,
  defaultValue?: string,
): string => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(currentValue).jsSnippets[0];

  changeValue = getCodeFromMoustache(changeValue) || defaultValue || "";
  try {
    return setEnumArgumentAtPosition(
      requiredValue,
      changeValue,
      argNum,
      getEvaluationVersion(),
    );
  } catch (e) {
    return currentValue;
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
    getEvaluationVersion(),
  );
};

export const callBackFieldSetter = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const requiredValue = getCodeFromMoustache(currentValue);
  const requiredChangeValue = getCodeFromMoustache(changeValue) || "() => {}";

  try {
    return `{{${
      setCallbackFunctionField(
        requiredValue,
        requiredChangeValue,
        argNum,
        getEvaluationVersion(),
      ) || currentValue
    }}}`;
  } catch (e) {
    return currentValue;
  }
};

export const callBackFieldGetter = (value: string, argNumber = 0) => {
  const requiredValue = getCodeFromMoustache(value);
  const funcExpr = getFuncExpressionAtPosition(
    requiredValue,
    argNumber,
    getEvaluationVersion(),
  );

  return `{{${funcExpr}}}`;
};

export const genericSetter = (
  codeFragment: string,
  code: string,
  argNum = 0,
) => {
  codeFragment = codeFragment ? stringToJS(codeFragment) : "''";
  code = getCodeFromMoustache(code);
  const funcExpr = setGenericArgAtPostition(codeFragment, code, argNum);

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
    const isValid = isValidURL(str);

    if (isValid) return isValid;

    const looksLikeURL = matchesURLPattern(str);

    if (!looksLikeURL) return false;

    return isValidURL(`https://${str}`);
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

  const selectedField = allOptions.find((option) =>
    value.startsWith(option.value),
  );

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
  strict = false,
): TActionBlock {
  const jsCode = getCodeFromMoustache(code);
  const evaluationVersion = getEvaluationVersion();

  const selectedOption = getSelectedFieldFromValue(jsCode, fieldOptions);

  const mainActionType = (selectedOption.type ||
    selectedOption.value ||
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AppsmithFunction.none) as any;

  if (strict) {
    if (mainActionType === AppsmithFunction.none) {
      throw new Error("Invalid action detected");
    }

    // In the action selector field, if we can't find the selected option,
    // it means, we can't render that action correctly in the UI
    const fieldConfig = FIELD_CONFIG[FieldType.ACTION_SELECTOR_FIELD];
    const selectedOptionValue = fieldConfig.getter(jsCode);

    if (!selectedOptionValue) {
      throw new Error("Invalid action detected");
    }
  }

  if (chainableFns.includes(mainActionType) && multipleActions) {
    const successCallback = getFuncExpressionAtPosition(
      jsCode,
      0,
      evaluationVersion,
    );
    const { catch: catchBlock, then: thenBlock } = getThenCatchBlocksFromQuery(
      code,
      evaluationVersion,
    );

    const thenCallbackParams: string[] = getFunctionParams(
      thenBlock,
      evaluationVersion,
    );
    const thenCallbackBlocks = getFunctionBodyStatements(
      thenBlock,
      evaluationVersion,
    );

    const catchCallbackParams: string[] = getFunctionParams(
      catchBlock,
      evaluationVersion,
    );
    const catchCallbackBlocks = getFunctionBodyStatements(
      catchBlock,
      evaluationVersion,
    );

    const successCallbackParams: string[] = getFunctionParams(
      successCallback,
      evaluationVersion,
    );
    const successCallbackBlocks: string[] = getFunctionBodyStatements(
      successCallback,
      evaluationVersion,
    ).map((block: string) => block);

    const errorCallback = getFuncExpressionAtPosition(
      jsCode,
      1,
      evaluationVersion,
    );

    const errorCallbackParams: string[] = getFunctionParams(
      errorCallback,
      evaluationVersion,
    );
    const errorCallbackBlocks = getFunctionBodyStatements(
      errorCallback,
      evaluationVersion,
    ).map((block: string) => block);

    return {
      code: jsCode,
      actionType: mainActionType,
      success: {
        params: [...thenCallbackParams, ...successCallbackParams],
        blocks: [
          ...successCallbackBlocks.map((block: string) => ({
            ...codeToAction(block, fieldOptions, false, strict),
            type: "success" as const,
          })),
          ...thenCallbackBlocks.map((block: string) => ({
            ...codeToAction(block, fieldOptions, false, strict),
            type:
              successCallbackBlocks.length + errorCallbackBlocks.length > 0
                ? ("success" as const)
                : ("then" as const),
          })),
        ],
      },
      error: {
        params: [...catchCallbackParams, ...errorCallbackParams],
        blocks: [
          ...errorCallbackBlocks.map((block: string) => ({
            ...codeToAction(block, fieldOptions, false, strict),
            type: "failure" as const,
          })),
          ...catchCallbackBlocks.map((block: string) => ({
            ...codeToAction(block, fieldOptions, false, strict),
            type:
              successCallbackBlocks.length + errorCallbackBlocks.length > 0
                ? ("failure" as const)
                : ("catch" as const),
          })),
        ],
      },
    };
  }

  return {
    code: jsCode,
    actionType: mainActionType,
    success: { blocks: [] },
    error: { blocks: [] },
  };
}

export const chainableFns: TActionBlock["actionType"][] = [
  AppsmithFunction.integration,
  AppsmithFunction.navigateTo,
  AppsmithFunction.showAlert,
  AppsmithFunction.showModal,
  AppsmithFunction.closeModal,
  AppsmithFunction.storeValue,
  AppsmithFunction.clearStore,
  AppsmithFunction.removeValue,
  AppsmithFunction.copyToClipboard,
  AppsmithFunction.resetWidget,
  AppsmithFunction.showModal,
  AppsmithFunction.download,
  AppsmithFunction.logoutUser,
];

export function actionToCode(
  action: TActionBlock,
  multipleActions = true,
): string {
  const {
    actionType,
    code,
    error: { blocks: errorBlocks, params: errorParams },
    success: { blocks: successBlocks, params: successParams },
  } = action;

  const actionFieldConfig = FIELD_GROUP_CONFIG[actionType];
  const evaluationVersion = getEvaluationVersion();

  if (!actionFieldConfig) {
    return code;
  }

  /**
   * Unfortunately, we have to do this because the integration action could be represented with success and error callbacks
   * or then/catch blocks. We need to check if the action is an integration action and if it had a success or error callback
   * defined already to preserve the positions of params object which should first param when using then/catch and 3rd param when using
   * callbacks.
   */
  const supportsCallback = actionType === AppsmithFunction.integration;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (chainableFns.includes(actionType as any) && multipleActions) {
    const existingSuccessCallback =
      supportsCallback &&
      getFuncExpressionAtPosition(code, 0, evaluationVersion);
    const existingErrorCallback =
      supportsCallback &&
      getFuncExpressionAtPosition(code, 1, evaluationVersion);
    const thenBlockExists = checkIfThenBlockExists(code, evaluationVersion);
    const catchBlockExists = checkIfCatchBlockExists(code, evaluationVersion);

    if (actionType === AppsmithFunction.integration) {
      if (existingSuccessCallback || existingErrorCallback) {
        successBlocks.forEach((block) => {
          if (block.type === "then") {
            block.type = "success";
          }
        });
        errorBlocks.forEach((block) => {
          if (block.type === "catch") {
            block.type = "failure";
          }
        });
      }
    }

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
    const withSuccessCallback =
      existingSuccessCallback || existingErrorCallback
        ? setCallbackFunctionField(
            code,
            `(${
              successParams ? successParams.join(",") : ""
            }) => { ${successCallbackCode} }`,
            0,
            evaluationVersion,
          )
        : code;

    const withThenCallback =
      thenBlockExists || thenCallbackCode
        ? setThenBlockInQuery(
            withSuccessCallback,
            `(${
              successParams ? successParams.join(",") : ""
            }) => { ${thenCallbackCode} }`,
            evaluationVersion,
          )
        : withSuccessCallback;

    // Set callback function field only if there is a callback code
    const withErrorCallback =
      existingSuccessCallback || existingErrorCallback
        ? setCallbackFunctionField(
            withThenCallback,
            `(${
              errorParams ? errorParams.join(",") : ""
            }) => { ${errorCallbackCode} }`,
            1,
            evaluationVersion,
          )
        : withThenCallback;

    const withCatchCallback =
      catchBlockExists || catchCallbackCode
        ? setCatchBlockInQuery(
            withErrorCallback,
            `(${
              errorParams ? errorParams.join(",") : ""
            }) => { ${catchCallbackCode} }`,
            evaluationVersion,
          )
        : withErrorCallback;

    return withCatchCallback;
  }

  return code === "" || code.endsWith(";") ? code : code + ";";
}

export function isEmptyBlock(block: string) {
  return [";", "undefined;", ""].includes(getCodeFromMoustache(block));
}

/** {{Hello {{Input.text}}}} -> Hello {{Input.text}} */
export function getCodeFromMoustache(value = "") {
  // Remove white spaces around the braces, otherwise the regex will fail
  const code = value.trim().replace(/^{{|}}$/g, "");

  return code;
}

export function paramSetter(
  changeValue: string,
  currentValue: string,
  argNum?: number,
) {
  argNum = argNum || 0;
  const requiredValue = getCodeFromMoustache(currentValue);
  const changeValueWithoutBraces = getCodeFromMoustache(changeValue);

  return setQueryParam(
    requiredValue,
    changeValueWithoutBraces,
    argNum,
    getEvaluationVersion(),
  );
}

export function paramGetter(code: string, argNum?: number) {
  argNum = argNum || 0;
  const requiredValue = getCodeFromMoustache(code);

  return getQueryParam(requiredValue, argNum, getEvaluationVersion());
}

export function sortSubMenuOptions(options: TreeDropdownOption[]) {
  return (options as TreeDropdownOption[]).sort(
    (a: TreeDropdownOption, b: TreeDropdownOption) => {
      // Makes default labels like "New modal" show up on top
      if (DEFAULT_LABELS.includes(a.label)) {
        return -1;
      } else if (DEFAULT_LABELS.includes(b.label)) {
        return 1;
      } else {
        // numeric - true handles A10 being shown after A2
        return a.label.localeCompare(b.label, "en", { numeric: true });
      }
    },
  );
}
