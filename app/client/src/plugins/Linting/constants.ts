import { ECMA_VERSION } from "@shared/ast";
import type { LintOptions } from "jshint";
import isEntityFunction from "./utils/isEntityFunction";
import type { Linter } from "eslint-linter-browserify";
import { noFloatingPromisesLintRule } from "./customRules/no-floating-promises";

export enum LINTER_TYPE {
  "JSHINT" = "JSHint",
  "ESLINT" = "ESLint",
}

export const lintOptions = (
  globalData: Record<string, boolean>,
  linterType: LINTER_TYPE = LINTER_TYPE.JSHINT,
) => {
  if (linterType === LINTER_TYPE.JSHINT) {
    return {
      indent: 2,
      esversion: ECMA_VERSION,
      eqeqeq: false, // Not necessary to use ===
      curly: false, // Blocks can be added without {}, eg if (x) return true
      freeze: true, // Overriding inbuilt classes like Array is not allowed
      undef: true, // Undefined variables should be reported as error
      forin: false, // Doesn't require filtering for..in loops with obj.hasOwnProperty()
      noempty: false, // Empty blocks are allowed
      strict: false, // We won't force strict mode
      unused: "strict", // Unused variables are not allowed
      asi: true, // Tolerate Automatic Semicolon Insertion (no semicolons)
      boss: true, // Tolerate assignments where comparisons would be expected
      evil: false, // Use of eval not allowed
      funcscope: true, // Tolerate variable definition inside control statements
      sub: true, // Don't force dot notation
      expr: true, // suppresses warnings about the use of expressions where normally you would expect to see assignments or function calls
      // environments
      browser: false,
      worker: true,
      mocha: false,
      // global values
      globals: globalData,
      loopfunc: true,
    } as LintOptions;
  } else {
    const eslintGlobals: Record<string, "writable" | "readonly"> = {
      setTimeout: "readonly",
      clearTimeout: "readonly",
      console: "readonly",
    };

    for (const key in globalData) {
      if (globalData.hasOwnProperty(key)) {
        eslintGlobals[key] = "readonly";
      }
    }

    return {
      languageOptions: {
        ecmaVersion: ECMA_VERSION,
        globals: eslintGlobals,
        sourceType: "script",
      },
      plugins: {
        customRules: {
          rules: {
            "no-floating-promises": noFloatingPromisesLintRule,
          },
        },
      },
      rules: {
        "customRules/no-floating-promises": "error",
        eqeqeq: "off",
        curly: "off",
        "no-extend-native": "error",
        "no-undef": "error",
        "guard-for-in": "off",
        "no-empty": "off",
        strict: "off",
        "no-unused-vars": [
          "warn",
          { vars: "all", args: "all", ignoreRestSiblings: false },
        ],
        "no-cond-assign": "off",
        "no-eval": "error",
        "block-scoped-var": "off",
        "dot-notation": "off",
        "no-unused-expressions": "off",
        "no-loop-func": "off",
      },
    } as Linter.Config;
  }
};

export const JS_OBJECT_START_STATEMENT = "export default";
export const INVALID_JSOBJECT_START_STATEMENT = `JSObject must start with '${JS_OBJECT_START_STATEMENT}'`;
export const INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE =
  "INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE";
// https://github.com/jshint/jshint/blob/d3d84ae1695359aef077ddb143f4be98001343b4/src/messages.js#L204
export const IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE = "W117";

// For these error types, we want to show a warning
// All messages can be found here => https://github.com/jshint/jshint/blob/2.9.5/src/messages.js
export const WARNING_LINT_ERRORS = {
  "no-unused-vars": "'{a}' is assigned a value but never used.",
  W098: "'{a}' is defined but never used.",
  W014: "Misleading line break before '{a}'; readers may interpret this as an expression boundary.",
  ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD:
    "Cannot execute async code on functions bound to data fields",
  ACTION_MODAL_STRING: 'Use Modal1.name instead of "Modal" as a string',
};

export function asyncActionInSyncFieldLintMessage(isJsObject = false) {
  return isJsObject
    ? `Cannot execute async code on functions bound to data fields`
    : `Data fields cannot execute async code`;
}

/** These errors should be overlooked
 * E041 => Unrecoverable syntax error.
 * W032 => Unnecessary semicolon.
 */
export const IGNORED_LINT_ERRORS = ["E041", "W032"];
export const SUPPORTED_WEB_APIS = {
  console: true,
  crypto: true,
  fetch: true,
};
export enum CustomLintErrorCode {
  INVALID_ENTITY_PROPERTY = "INVALID_ENTITY_PROPERTY",
  ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD = "ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD",
  // ButtonWidget.text = "test"
  INVALID_WIDGET_PROPERTY_SETTER = "INVALID_WIDGET_PROPERTY_SETTER",
  // appsmith.store.value = "test"
  INVALID_APPSMITH_STORE_PROPERTY_SETTER = "INVALID_APPSMITH_STORE_PROPERTY_SETTER",
  // showModal("Modal1")
  ACTION_MODAL_STRING = "ACTION_MODAL_STRING",
  INVALID_INPUTS = "INVALID_INPUTS",
}

export const CUSTOM_LINT_ERRORS: Record<
  CustomLintErrorCode,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]) => string
> = {
  [CustomLintErrorCode.INVALID_ENTITY_PROPERTY]: (
    entityName: string,
    propertyName: string,
    entity: unknown,
    isJsObject: boolean,
  ) =>
    isEntityFunction(entity, propertyName, entityName)
      ? asyncActionInSyncFieldLintMessage(isJsObject)
      : `"${propertyName}" doesn't exist in ${entityName}`,

  [CustomLintErrorCode.ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD]: (
    dataFieldBindings: string[],
    fullName: string,
    isMarkedAsync: boolean,
  ) => {
    const hasMultipleBindings = dataFieldBindings.length > 1;
    const bindings = dataFieldBindings.join(" , ");

    return isMarkedAsync
      ? `Cannot bind async functions to data fields. Convert this to a sync function or remove references to "${fullName}" on the following data ${
          hasMultipleBindings ? "fields" : "field"
        }: ${bindings}`
      : `Functions bound to data fields cannot execute async code. Remove async statements highlighted below or remove references to "${fullName}" on the following data ${
          hasMultipleBindings ? "fields" : "field"
        }: ${bindings}`;
  },
  [CustomLintErrorCode.INVALID_WIDGET_PROPERTY_SETTER]: (
    methodName: string,
    objectName: string,
    propertyName: string,
    isValidProperty: boolean,
  ) => {
    const suggestionSentence = methodName
      ? `Use ${methodName}(value) instead.`
      : `Use ${objectName} setter method instead.`;

    const lintErrorMessage = !isValidProperty
      ? `${objectName} doesn't have a property named ${propertyName}`
      : `Direct mutation of widget properties is not supported. ${suggestionSentence}`;

    return lintErrorMessage;
  },
  [CustomLintErrorCode.INVALID_APPSMITH_STORE_PROPERTY_SETTER]: () => {
    return "Use storeValue() method to modify the store";
  },
  [CustomLintErrorCode.ACTION_MODAL_STRING]: (modalName: string) => {
    return `Use ${modalName}.name instead of "${modalName}" as a string`;
  },
  [CustomLintErrorCode.INVALID_INPUTS]: (
    inputs: string[],
    invalidKey: string,
  ) => {
    return `${invalidKey} doesn't exist in valid list of inputs: ${inputs.join(", ")} `;
  },
};
