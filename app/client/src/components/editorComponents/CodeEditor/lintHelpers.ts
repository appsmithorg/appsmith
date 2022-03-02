import { last, isNumber } from "lodash";
import { Annotation, Position } from "codemirror";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { Severity } from "entities/AppsmithConsole";
import { LintTooltipDirection, WARNING_LINT_ERRORS } from "./constants";

export const getIndexOfRegex = (
  str: string,
  regex: RegExp,
  start = 0,
): number => {
  const pos = str.substr(start).search(regex);
  return pos > -1 ? pos + start : pos;
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
      const substr = str.substr(0, index);
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

export const getLintAnnotations = (
  value: string,
  errors: EvaluationError[],
): Annotation[] => {
  const annotations: Annotation[] = [];
  const lintErrors = errors.filter(
    (error) => error.errorType === PropertyEvaluationErrorType.LINT,
  );
  const lines = value.split("\n");
  lintErrors.forEach((error) => {
    const {
      ch,
      errorMessage,
      line,
      originalBinding,
      severity,
      variables,
    } = error;

    if (!originalBinding) {
      return annotations;
    }

    let variableLength = 1;
    // Find the variable with minimal length
    if (variables) {
      for (const variable of variables) {
        if (variable) {
          variableLength =
            variableLength === 1
              ? variable.length
              : Math.min(variable.length, variableLength);
        }
      }
    }

    const bindingPositions = getKeyPositionInString(value, originalBinding);

    if (isNumber(line) && isNumber(ch)) {
      for (const bindingLocation of bindingPositions) {
        const currentLine = bindingLocation.line + line;
        const lineContent = lines[currentLine] || "";
        const currentCh =
          bindingLocation.line !== currentLine ? ch : bindingLocation.ch + ch;
        // Jshint counts \t as two characters and codemirror counts it as 1.
        // So we need to subtract number of tabs to get accurate position
        const tabs = lineContent.substr(0, currentCh).match(/\t/g)?.length || 0;

        const from = {
          line: currentLine,
          ch: currentCh - tabs - 1,
        };
        const to = {
          line: from.line,
          ch: from.ch + variableLength,
        };
        annotations.push({
          from,
          to,
          message: errorMessage,
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

export const getLintSeverity = (
  code: string,
): Severity.WARNING | Severity.ERROR => {
  const severity =
    code in WARNING_LINT_ERRORS ? Severity.WARNING : Severity.ERROR;
  return severity;
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
