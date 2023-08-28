import { QUOTED_BINDING_REGEX } from "constants/BindingsConstants";
import { EvaluationSubstitutionType } from "entities/DataTree/types";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { TemplateSubstitutor } from "./TemplateSubstitutor";
import { ParameterSubstitutor } from "./ParameterSubstitutor";
import { SmartSubstitutor } from "./SmartSubstitutor";

export abstract class Substitutor {
  abstract substitute(
    binding: string,
    subSegments: string[],
    subSegmentValues: unknown[],
  ): string | { value: string; parameters: Record<string, unknown> };

  filterBindingSegmentsAndRemoveQuotes = (
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
}

export class SubstitutorFactory {
  static getSubstitutor(
    substitutionType: EvaluationSubstitutionType,
  ): Substitutor {
    if (substitutionType === EvaluationSubstitutionType.PARAMETER) {
      return new ParameterSubstitutor();
    }
    if (substitutionType === EvaluationSubstitutionType.SMART_SUBSTITUTE) {
      return new SmartSubstitutor();
    }
    return new TemplateSubstitutor();
  }
}
