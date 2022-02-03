import { getType, Types } from "utils/TypeHelpers";
import _ from "lodash";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { QUOTED_BINDING_REGEX } from "constants/BindingsConstants";

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
  const subValues: unknown[] = [];
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
  subSegmentValues: unknown[],
): string => {
  const {
    binding,
    subBindings,
    subValues,
  } = filterBindingSegmentsAndRemoveQuotes(
    originalBinding,
    subSegments,
    subSegmentValues,
  );
  let finalBinding = binding;
  subBindings.forEach((b, i) => {
    const value = subValues[i];
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
  return finalBinding;
};

export const parameterSubstituteDynamicValues = (
  originalBinding: string,
  subSegments: string[],
  subSegmentValues: unknown[],
) => {
  const {
    binding,
    subBindings,
    subValues,
  } = filterBindingSegmentsAndRemoveQuotes(
    originalBinding,
    subSegments,
    subSegmentValues,
  );
  // if only one binding is provided in the whole string, we need to throw an error
  if (subSegments.length === 1 && subBindings.length === 1) {
    throw Error(
      "Dynamic bindings in prepared statements are only used to provide parameters inside SQL query. No SQL query found.",
    );
  }

  let finalBinding = binding;
  const parameters: Record<string, unknown> = {};
  subBindings.forEach((b, i) => {
    // Replace binding with $1, $2;
    const key = `$${i + 1}`;
    finalBinding = finalBinding.replace(b, key);
    parameters[key] =
      typeof subValues[i] === "object"
        ? JSON.stringify(subValues[i], null, 2)
        : subValues[i];
  });
  return { value: finalBinding, parameters };
};
// For creating a final value where bindings could be in a template format
export const templateSubstituteDynamicValues = (
  binding: string,
  subBindings: string[],
  subValues: unknown[],
): string => {
  // Replace the string with the data tree values
  let finalValue = binding;
  subBindings.forEach((b, i) => {
    let value = subValues[i];
    if (Array.isArray(value) || _.isObject(value)) {
      value = JSON.stringify(value);
    }
    try {
      if (typeof value === "string" && JSON.parse(value)) {
        value = value.replace(/\\([\s\S])|(")/g, "\\$1$2");
      }
    } catch (e) {
      // do nothing
    }
    finalValue = finalValue.replace(b, `${value}`);
  });
  return finalValue;
};

export const substituteDynamicBindingWithValues = (
  binding: string,
  subSegments: string[],
  subSegmentValues: unknown[],
  evaluationSubstitutionType: EvaluationSubstitutionType,
): string | { value: string; parameters: Record<string, unknown> } => {
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
