import _ from "lodash";
import { Annotation, Position } from "codemirror";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";

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
      const ch = _.last(substrLines)?.length || 0;
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

  lintErrors.forEach((error) => {
    const { errorMessage, originalBinding, severity, variables } = error;

    if (!originalBinding) {
      return annotations;
    }

    // We find the location of binding in the editor value and then
    // we find locations of jshint variables (a, b, c, d) in the binding and highlight them
    const bindingPositions = getKeyPositionInString(value, originalBinding);

    for (const bindingLocation of bindingPositions) {
      if (variables?.filter((v) => v).length) {
        for (let variable of variables) {
          if (typeof variable === "number") {
            variable = variable.toString();
          }
          if (variable && originalBinding.includes(variable)) {
            const variableLocations = getKeyPositionInString(
              originalBinding,
              variable,
            );

            for (const variableLocation of variableLocations) {
              const from = {
                line: bindingLocation.line + variableLocation.line,
                // if the binding is a multiline function we need to
                // use jshint variable position as the starting point
                ch:
                  variableLocation.line > 0
                    ? variableLocation.ch
                    : variableLocation.ch + bindingLocation.ch,
              };

              const to = {
                line: from.line,
                ch: from.ch + variable.length,
              };

              const annotation = {
                from,
                to,
                message: errorMessage,
                severity,
              };

              annotations.push(annotation);
            }
          }
        }
      } else {
        const from = bindingLocation;
        const to = { line: from.line, ch: from.ch + 3 };
        const annotation = {
          from,
          to,
          message: errorMessage,
          severity,
        };
        annotations.push(annotation);
      }
    }
  });
  return annotations;
};
