import { ECMA_VERSION } from "@shared/ast";
import type { LintOptions } from "jshint";
import { isEntityFunction } from "./utils";

export const lintOptions = (globalData: Record<string, boolean>) =>
  ({
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
    browser: true,
    worker: true,
    mocha: false,
    // global values
    globals: globalData,
    loopfunc: true,
  } as LintOptions);
export const JS_OBJECT_START_STATEMENT = "export default";
export const INVALID_JSOBJECT_START_STATEMENT = `JSObject must start with '${JS_OBJECT_START_STATEMENT}'`;
export const INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE =
  "INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE";
// https://github.com/jshint/jshint/blob/d3d84ae1695359aef077ddb143f4be98001343b4/src/messages.js#L204
export const IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE = "W117";

// For these error types, we want to show a warning
// All messages can be found here => https://github.com/jshint/jshint/blob/2.9.5/src/messages.js
export const WARNING_LINT_ERRORS = {
  W098: "'{a}' is defined but never used.",
  W014: "Misleading line break before '{a}'; readers may interpret this as an expression boundary.",
  ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD:
    "Cannot execute async code on functions bound to data fields",
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
};
export enum CustomLintErrorCode {
  INVALID_ENTITY_PROPERTY = "INVALID_ENTITY_PROPERTY",
  ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD = "ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD",
}

export const CUSTOM_LINT_ERRORS: Record<
  CustomLintErrorCode,
  (...args: any[]) => string
> = {
  [CustomLintErrorCode.INVALID_ENTITY_PROPERTY]: (
    entityName: string,
    propertyName: string,
    entity: unknown,
    isJsObject: boolean,
  ) =>
    isEntityFunction(entity, propertyName)
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
};
