import type { ValidationConfig } from "constants/PropertyControlConstants";
import { Severity } from "entities/AppsmithConsole";
import type {
  WidgetEntity,
  WidgetEntityConfig,
} from "@appsmith/entities/DataTree/types";
import type { ConfigTree } from "entities/DataTree/dataTreeTypes";
import { isObject, set } from "lodash";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import {
  isPathDynamicTrigger,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import {
  addErrorToEntityProperty,
  getEntityNameAndPropertyPath,
  resetValidationErrorsForEntityProperty,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { validate } from "workers/Evaluation/validations";
import type { EvalPathsIdenticalToState, EvalProps } from ".";
import type { ValidationResponse } from "constants/WidgetValidation";

const LARGE_COLLECTION_SIZE = 100;

const getIsLargeCollection = (val: any) => {
  if (!Array.isArray(val)) return false;
  const rowSize = !isObject(val[0]) ? 1 : Object.keys(val[0]).length;

  const size = val.length * rowSize;

  return size > LARGE_COLLECTION_SIZE;
};
export function setToEvalPathsIdenticalToState({
  evalPath,
  evalPathsIdenticalToState,
  evalProps,
  fullPropertyPath,
  isParsedValueTheSame,
  value,
}: {
  evalPath: string;
  evalPathsIdenticalToState: EvalPathsIdenticalToState;
  evalProps: EvalProps;
  isParsedValueTheSame: boolean;
  fullPropertyPath: string;
  value: unknown;
}) {
  const isLargeCollection = getIsLargeCollection(value);

  if (isParsedValueTheSame && isLargeCollection) {
    evalPathsIdenticalToState[evalPath] = fullPropertyPath;
  } else {
    delete evalPathsIdenticalToState[evalPath];

    set(evalProps, evalPath, value);
  }
}
export function validateAndParseWidgetProperty({
  configTree,
  evalPropertyValue,
  evalProps,
  fullPropertyPath,
  unEvalPropertyValue,
  widget,
}: {
  fullPropertyPath: string;
  widget: WidgetEntity;
  configTree: ConfigTree;
  evalPropertyValue: unknown;
  unEvalPropertyValue: string;
  evalProps: EvalProps;
  evalPathsIdenticalToState: EvalPathsIdenticalToState;
}): unknown {
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);

  if (isPathDynamicTrigger(widget, propertyPath)) {
    // TODO find a way to validate triggers
    return unEvalPropertyValue;
  }
  const widgetConfig = configTree[widget.widgetName] as WidgetEntityConfig;
  const validation = widgetConfig.validationPaths[propertyPath];

  const { isValid, messages, parsed } = validateWidgetProperty(
    validation,
    evalPropertyValue,
    widget,
    propertyPath,
  );

  // remove already present validation errors
  resetValidationErrorsForEntityProperty({
    evalProps,
    fullPropertyPath,
  });

  if (isValid) {
  } else {
    const evalErrors: EvaluationError[] =
      messages?.map((message) => {
        return {
          raw: unEvalPropertyValue,
          errorMessage: message || {},
          errorType: PropertyEvaluationErrorType.VALIDATION,
          severity: Severity.ERROR,
        };
      }) ?? [];
    // Add validation errors
    addErrorToEntityProperty({
      errors: evalErrors,
      evalProps,
      fullPropertyPath,
      configTree,
    });
  }

  return parsed;
}

export function validateWidgetProperty(
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
  propertyPath: string,
) {
  if (!config) {
    return {
      isValid: true,
      parsed: value,
    };
  }
  return validate(config, value, props, propertyPath);
}

export function validateActionProperty(
  config: ValidationConfig,
  value: unknown,
): ValidationResponse {
  if (!config) {
    return {
      isValid: true,
      parsed: value,
    };
  }
  return validate(config, value, {}, "");
}
