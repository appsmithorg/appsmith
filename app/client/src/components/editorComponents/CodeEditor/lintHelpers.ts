import { last, isNumber, isEmpty } from "lodash";
import type { Annotation, Position } from "codemirror";
import type { LintError } from "utils/DynamicBindingUtils";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { Severity } from "entities/AppsmithConsole";
import {
  CODE_EDITOR_START_POSITION,
  LintTooltipDirection,
  VALID_JS_OBJECT_BINDING_POSITION,
} from "./constants";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import {
  CUSTOM_LINT_ERRORS,
  IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE,
  INVALID_JSOBJECT_START_STATEMENT,
  INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE,
} from "plugins/Linting/constants";
export const getIndexOfRegex = (
  str: string,
  regex: RegExp,
  start = 0,
): number => {
  const pos = str.slice(start).search(regex);

  return pos > -1 ? pos + start : pos;
};

interface LintAnnotationOptions {
  isJSObject: boolean;
  contextData: AdditionalDynamicDataTree;
}

/**
 *
 * @param error
 * @param contextData
 * @returns A boolean signifying the presence of an identifier which the linter records as been "not defined"
 * but is passed to the editor as additional dynamic data
 */
const hasUndefinedIdentifierInContextData = (
  error: LintError,
  contextData: LintAnnotationOptions["contextData"],
) => {
  /**
   * W117: "'{a}' is not defined.",
   * error has only one variable "a", which is the name of the variable which is not defined.
   *  */
  return (
    error.code === IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE &&
    error.variables &&
    error.variables[0] &&
    error.variables[0] in contextData
  );
};
const buildBoundaryRegex = (key: string) => {
  return key
    .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    .replace(/\w+/g, "\\b$&\\b");
};

export const getAllWordOccurrences = (str: string, key: string) => {
  const indices = [];
  let index, startIndex;
  const regex = new RegExp(buildBoundaryRegex(key));

  index = getIndexOfRegex(str, regex, startIndex);

  while (index > -1) {
    indices.push(index);
    startIndex = index + key.length;
    index = getIndexOfRegex(str, regex, startIndex);
  }

  return indices;
};

export const getKeyPositionInString = (
  str: string,
  key: string,
): Position[] => {
  const indices = getAllWordOccurrences(str, key);
  let positions: Position[] = [];

  if (str.includes("\n")) {
    for (const index of indices) {
      const substr = str.slice(0, index);
      const substrLines = substr.split("\n");
      const ch = last(substrLines)?.length || 0;
      const line = substrLines.length - 1;

      positions.push({ line, ch });
    }
  } else {
    positions = indices.map((index) => ({ line: 0, ch: index }));
  }

  return positions;
};

export const getFirstNonEmptyPosition = (lines: string[]): Position => {
  const lineNumber = lines.findIndex((line) => !isEmpty(line));

  return lineNumber > -1
    ? {
        line: lineNumber,
        ch: lines[lineNumber].length,
      }
    : CODE_EDITOR_START_POSITION;
};

export const filterInvalidLintErrors = (
  errors: LintError[],
  contextData?: AdditionalDynamicDataTree,
) => {
  return errors.filter(
    (error) =>
      // Remove all errors where additional dynamic data is reported as undefined
      !(contextData && hasUndefinedIdentifierInContextData(error, contextData)),
  );
};

export const getLintAnnotations = (
  value: string,
  errors: LintError[],
  options: Partial<LintAnnotationOptions>,
): Annotation[] => {
  const { contextData, isJSObject } = options;
  const annotations: Annotation[] = [];
  const lintErrors = filterInvalidLintErrors(errors, contextData);
  const lines = value.split("\n");

  lintErrors.forEach((error) => {
    const {
      ch,
      code,
      errorMessage,
      line,
      lintLength,
      originalBinding,
      severity,
      variables,
    } = error;

    if (!originalBinding) {
      return annotations;
    }

    if (code === INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE) {
      // The binding position of every valid JS Object is constant, so we need not
      // waste time checking for position of binding.
      // For JS Objects not starting with the expected "export default" statement, we return early
      // with a "invalid start statement" lint error
      return annotations.push({
        from: CODE_EDITOR_START_POSITION,
        to: getFirstNonEmptyPosition(lines),
        message: INVALID_JSOBJECT_START_STATEMENT,
        severity: Severity.ERROR,
      });
    }

    let calculatedLintLength = 1;

    // If lint length is provided, then skip the length calculation logic
    if (lintLength && lintLength > 0) {
      calculatedLintLength = lintLength;
    }
    // Find the variable with minimal length
    else if (variables) {
      for (const variable of variables) {
        if (variable) {
          calculatedLintLength =
            calculatedLintLength === 1
              ? String(variable).length
              : Math.min(String(variable).length, calculatedLintLength);
        }
      }
    }

    const bindingPositions = isJSObject
      ? [VALID_JS_OBJECT_BINDING_POSITION]
      : getKeyPositionInString(value, originalBinding);

    if (isNumber(line) && isNumber(ch)) {
      for (const bindingLocation of bindingPositions) {
        const currentLine = bindingLocation.line + line;
        const lineContent = lines[currentLine] || "";
        let currentCh: number;

        // for case where "{{" is in the same line as the lint error
        if (bindingLocation.line === currentLine) {
          currentCh =
            bindingLocation.ch +
            ch +
            // Add 2 to account for "{{", if binding is a dynamicValue (NB: JS Objects are dynamicValues without "{{}}")
            (isDynamicValue(originalBinding) ? 2 : 0);
        } else {
          currentCh = ch;
        }

        // Jshint counts \t as two characters and codemirror counts it as 1.
        // So we need to subtract number of tabs to get accurate position.
        // This is not needed for custom lint errors, since they are not generated by JSHint
        // ESLint doesn't have this issue and hence we are skipping if lint is generated via eslint
        const tabs =
          (error.code && error.code in CUSTOM_LINT_ERRORS) ||
          (lintLength && lintLength > 0)
            ? 0
            : lineContent.slice(0, currentCh).match(/\t/g)?.length || 0;
        const from = {
          line: currentLine,
          ch: currentCh - tabs - 1,
        };
        const to = {
          line: from.line,
          ch: from.ch + calculatedLintLength,
        };

        annotations.push({
          from,
          to,
          message: errorMessage.message,
          severity,
        });
      }
    } else {
      // Don't show linting errors if code has parsing errors
      return [];
    }
  });

  return annotations;
};

/* By default, lint tooltips are rendered to the right of the cursor
if the tooltip overflows out of the page, we want to render it to the left of the cursor
*/
export const getLintTooltipDirection = (
  tooltip: Element,
): LintTooltipDirection => {
  if (
    tooltip.getBoundingClientRect().right >
    (window.innerWidth || document.documentElement.clientWidth)
  ) {
    return LintTooltipDirection.left;
  } else {
    return LintTooltipDirection.right;
  }
};
