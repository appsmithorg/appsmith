import _ from "lodash";
import { Annotation, Position } from "codemirror";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";

const getAllOccurences = (str: string, key: string) => {
  const indicies = [];
  const keylen = key.length;
  let index, startIndex;
  index = str.indexOf(key, startIndex);
  while (index > -1) {
    indicies.push(index);
    startIndex = index + keylen;
    index = str.indexOf(key, startIndex);
  }

  return indicies;
};

export const getKeyPositionInString = (
  str: string,
  key: string,
): Position[] => {
  const indicies = getAllOccurences(str, key);
  let positions: Position[] = [];
  if (str.includes("\n")) {
    for (const index of indicies) {
      const substr = str.substr(0, index);
      const substrLines = substr.split("\n");
      const ch = _.last(substrLines)?.length || 0;
      const line = substrLines.length - 1;

      positions.push({ line, ch });
    }
  } else {
    positions = indicies.map((index) => ({ line: 0, ch: index }));
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
    // we find locations of jshint variabls (a, b, c, d) in the binding and highlight them
    const bindingPositions = getKeyPositionInString(value, originalBinding);

    for (const bindingLocation of bindingPositions) {
      if (variables) {
        for (const variable of variables) {
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
                severity: severity,
              };

              annotations.push(annotation);
            }
          }
        }
      }
    }
  });
  return annotations;
};
