import type { ValidationConfig } from "constants/PropertyControlConstants";
import { Severity } from "entities/AppsmithConsole";
import type {
  ConfigTree,
  DataTree,
  WidgetEntity,
  WidgetEntityConfig,
} from "@appsmith/entities/DataTree/types";
import { get, isObject, isUndefined, set } from "lodash";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import {
  getEvalValuePath,
  isPathDynamicTrigger,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import {
  addErrorToEntityProperty,
  getEntityNameAndPropertyPath,
  isWidget,
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
  evalPathsIdenticalToState,
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

  const { isValid, messages, parsed, transformed } = validateWidgetProperty(
    validation,
    evalPropertyValue,
    widget,
    propertyPath,
  );

  let evaluatedValue;

  // remove already present validation errors
  resetValidationErrorsForEntityProperty({
    evalProps,
    fullPropertyPath,
  });

  if (isValid) {
    evaluatedValue = parsed;
  } else {
    evaluatedValue = isUndefined(transformed) ? evalPropertyValue : transformed;

    const evalErrors: EvaluationError[] =
      messages?.map((message) => {
        return {
          raw: unEvalPropertyValue,
          errorMessage: message || "",
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

  const evalPath = getEvalValuePath(fullPropertyPath, {
    isPopulated: false,
    fullPath: true,
  });
  const isParsedValueTheSame = parsed === evaluatedValue;

  setToEvalPathsIdenticalToState({
    evalPath,
    evalPathsIdenticalToState,
    evalProps,
    isParsedValueTheSame,
    fullPropertyPath,
    value: evaluatedValue,
  });

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
/**
 * Validates all the nodes of the tree to make sure all the values are as expected according to the validation config
 *
 * For example :- If Button.isDisabled is set to false in propertyPane then it would be passed as "false" in unEvalTree and validateTree method makes sure to convert it to boolean.
 * @param tree
 * @param option
 * @param configTree
 * @returns
 */
export function getValidatedTree(
  dataTree: DataTree,
  option: {
    evalProps: EvalProps;
    evalPathsIdenticalToState: EvalPathsIdenticalToState;
    pathsValidated: string[];
  },
  configTree: ConfigTree,
) {
  const { evalPathsIdenticalToState, evalProps, pathsValidated } = option;
  for (const [entityName, entity] of Object.entries(dataTree)) {
    if (!isWidget(entity)) {
      continue;
    }
    const entityConfig = configTree[entityName] as WidgetEntityConfig;

    const validationPathsMap = Object.entries(entityConfig.validationPaths);

    for (const [propertyPath, validationConfig] of validationPathsMap) {
      const fullPropertyPath = `${entityName}.${propertyPath}`;

      if (pathsValidated.includes(fullPropertyPath)) continue;

      const value = get(entity, propertyPath);
      // Pass it through parse
      const { isValid, messages, parsed, transformed } = validateWidgetProperty(
        validationConfig,
        value,
        entity,
        propertyPath,
      );

      set(entity, propertyPath, parsed);

      const evaluatedValue = isValid
        ? parsed
        : isUndefined(transformed)
        ? value
        : transformed;

      const isParsedValueTheSame = parsed === evaluatedValue;

      const evalPath = getEvalValuePath(fullPropertyPath, {
        isPopulated: false,
        fullPath: true,
      });

      setToEvalPathsIdenticalToState({
        evalPath,
        evalPathsIdenticalToState,
        evalProps,
        isParsedValueTheSame,
        fullPropertyPath,
        value: evaluatedValue,
      });

      resetValidationErrorsForEntityProperty({
        evalProps,
        fullPropertyPath,
      });

      if (!isValid) {
        const evalErrors: EvaluationError[] =
          messages?.map((message) => ({
            errorType: PropertyEvaluationErrorType.VALIDATION,
            errorMessage: message,
            severity: Severity.ERROR,
            raw: value,
          })) ?? [];

        addErrorToEntityProperty({
          errors: evalErrors,
          evalProps,
          fullPropertyPath,
          configTree,
        });
      }
    }
  }
  return dataTree;
}
