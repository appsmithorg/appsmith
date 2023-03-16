import { ECMA_VERSION } from "@shared/ast";
import type { LintOptions } from "jshint";

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
// https://github.com/jshint/jshint/blob/d3d84ae1695359aef077ddb143f4be98001343b4/src/messages.js#L204
export const IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE = "W117";

// For these error types, we want to show a warning
// All messages can be found here => https://github.com/jshint/jshint/blob/2.9.5/src/messages.js
export const WARNING_LINT_ERRORS = {
  W098: "'{a}' is defined but never used.",
  W014: "Misleading line break before '{a}'; readers may interpret this as an expression boundary.",
};

export function asyncActionInSyncFieldLintMessage(actionName: string) {
  return `Async framework action "${actionName}" cannot be executed in a function that is bound to a sync field.`;
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
}
export const CUSTOM_LINT_ERRORS: Record<
  CustomLintErrorCode,
  (...args: any[]) => string
> = {
  [CustomLintErrorCode.INVALID_ENTITY_PROPERTY]: (
    entityName: string,
    propertyName: string,
  ) => `"${propertyName}" doesn't exist in ${entityName}`,
};
