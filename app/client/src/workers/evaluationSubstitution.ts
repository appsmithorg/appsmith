import { getType, Types } from "utils/TypeHelpers";
import _ from "lodash";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { QUOTED_BINDING_REGEX } from "constants/BindingsConstants";
import { EvalResult } from "./evaluate";

const filterBindingSegmentsAndRemoveQuotes = (
  binding: string,
  subSegments: string[],
  subSegmentValues: unknown[],
) => {
  const bindingStrippedQuotes = binding.replace(
    QUOTED_BINDING_REGEX,
    (original, firstGroup) => {
      return firstGroup;
    },
  );
  const subBindings: string[] = [];
  const subValues: any = [];
  subSegments.forEach((segment, i) => {
    if (isDynamicValue(segment)) {
      subBindings.push(segment);
      subValues.push(subSegmentValues[i]);
    }
  });
  return { binding: bindingStrippedQuotes, subBindings, subValues };
};

export const smartSubstituteDynamicValues = (
  originalBinding: string,
  subSegments: string[],
  subSegmentValues: any,
): EvalResult => {
  const {
    binding,
    subValues,
    subBindings,
  } = filterBindingSegmentsAndRemoveQuotes(
    originalBinding,
    subSegments,
    subSegmentValues,
  );
  let finalBinding = binding;
  const finalResult: Array<string> = [];
  subBindings.forEach((b, i) => {
    const value = _.isObject(subValues[i]) ? subValues[i].result : subValues[i];
    const error = subValues[i].error;
    if (error) {
      finalResult.push(error);
    }
    switch (getType(value)) {
      case Types.NUMBER:
      case Types.BOOLEAN:
      case Types.NULL:
      case Types.UNDEFINED:
        // Direct substitution
        finalBinding = finalBinding.replace(b, `${value}`);
        break;
      case Types.STRING:
        // Add quotes to a string
        // JSON.stringify string to escape any unsupported characters
        finalBinding = finalBinding.replace(b, `${JSON.stringify(value)}`);
        break;
      case Types.ARRAY:
      case Types.OBJECT:
        // Stringify and substitute
        finalBinding = finalBinding.replace(b, JSON.stringify(value, null, 2));
        break;
    }
  });
  const finalError = finalResult.join("\n");
  return { result: finalBinding, error: finalError };
};

export const parameterSubstituteDynamicValues = (
  originalBinding: string,
  subSegments: string[],
  subSegmentValues: unknown[],
) => {
  const {
    binding,
    subValues,
    subBindings,
  } = filterBindingSegmentsAndRemoveQuotes(
    originalBinding,
    subSegments,
    subSegmentValues,
  );
  let finalBinding = binding;
  const finalResult: Array<string> = [];
  const parameters: Record<string, unknown> = {};
  subBindings.forEach((b, i) => {
    // Replace binding with $1, $2;
    const error = subValues[i].error;
    const key = `$${i + 1}`;
    finalBinding = finalBinding.replace(b, key);
    if (error) {
      finalResult.push(error);
    }
    parameters[key] =
      typeof subValues[i] === "object"
        ? JSON.stringify(subValues[i], null, 2)
        : subValues[i];
  });
  const finalError = finalResult.join("\n");
  return { result: finalBinding, parameters, error: finalError };
};
// For creating a final value where bindings could be in a template format
export const templateSubstituteDynamicValues = (
  binding: string,
  subBindings: string[],
  subValues: any,
): EvalResult => {
  // Replace the string with the data tree values
  let finalValue = binding;
  const finalResult: Array<string> = [];
  let finalError;
  subBindings.forEach((b, i) => {
    let value = _.isObject(subValues[i]) ? subValues[i].result : subValues[i];
    const error = subValues[i].error;
    if (Array.isArray(value) || _.isObject(value)) {
      value = JSON.stringify(value);
    }
    if (error) {
      finalResult.push(error);
    }
    try {
      if (typeof value === "string" && JSON.parse(value)) {
        value = value.replace(/\\([\s\S])|(")/g, "\\$1$2");
      }
    } catch (e) {
      // do nothing
    }
    finalValue = finalValue.replace(b, `${value}`);
    finalError = finalResult.join("\n");
  });
  return { result: finalValue, error: finalError };
};

export const substituteDynamicBindingWithValues = (
  binding: string,
  subSegments: string[],
  subSegmentValues: unknown[],
  evaluationSubstitutionType: EvaluationSubstitutionType,
): EvalResult => {
  switch (evaluationSubstitutionType) {
    case EvaluationSubstitutionType.TEMPLATE:
      return templateSubstituteDynamicValues(
        binding,
        subSegments,
        subSegmentValues,
      );
    case EvaluationSubstitutionType.SMART_SUBSTITUTE:
      return smartSubstituteDynamicValues(
        binding,
        subSegments,
        subSegmentValues,
      );
    case EvaluationSubstitutionType.PARAMETER:
      return parameterSubstituteDynamicValues(
        binding,
        subSegments,
        subSegmentValues,
      );
  }
};
