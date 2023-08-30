import type { ValidationConfig } from "constants/PropertyControlConstants";
import { Severity } from "entities/AppsmithConsole";
import type {
  ConfigTree,
  DataTree,
  WidgetEntity,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
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
import type { EvalProps } from ".";
import type { ValidationResponse } from "constants/WidgetValidation";
import produce, { current, isDraft } from "immer";

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
  isParsedValueTheSame,
  statePath,
  value,
}: any) {
  const isLargeCollection = getIsLargeCollection(value);

  if (isParsedValueTheSame && isLargeCollection) {
    evalPathsIdenticalToState[evalPath] = statePath;
  } else {
    delete evalPathsIdenticalToState[evalPath];
    const res = isDraft(value) ? current(value) : value;
    set(evalProps, evalPath, res);
  }
}
export function validateAndParseWidgetProperty({
  configTree,
  currentTree,
  evalPathsIdenticalToState,
  evalPropertyValue,
  evalProps,
  fullPropertyPath,
  unEvalPropertyValue,
  widget,
}: {
  fullPropertyPath: string;
  widget: WidgetEntity;
  currentTree: DataTree;
  configTree: ConfigTree;
  evalPropertyValue: unknown;
  unEvalPropertyValue: string;
  evalProps: EvalProps;
  evalPathsIdenticalToState: any;
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
      dataTree: currentTree,
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
    statePath: fullPropertyPath,
    value: evaluatedValue,
  });

  return isDraft(parsed) ? current(parsed) : parsed;
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

export function getValidatedTree(
  tree: DataTree,
  option: { evalProps: EvalProps; evalPathsIdenticalToState: any },
  configTree: ConfigTree,
) {
  const { evalPathsIdenticalToState, evalProps } = option;
  return produce(tree, (tree) => {
    Object.keys(tree).forEach((entityKey: string) => {
      const entity = tree[entityKey];
      if (!isWidget(entity)) {
        return;
      }
      const entityConfig = configTree[entityKey] as WidgetEntityConfig;

      Object.entries(entityConfig.validationPaths).forEach(
        ([property, validation]) => {
          const value = get(entity, property);
          // const value = get(parsedEntity, property);
          // Pass it through parse
          const { isValid, messages, parsed, transformed } =
            validateWidgetProperty(validation, value, entity, property);
          set(entity, property, parsed);
          const evaluatedValue = isValid
            ? parsed
            : isUndefined(transformed)
            ? value
            : transformed;

          const isParsedValueTheSame = parsed === evaluatedValue;
          const fullPropertyPath = `${entityKey}.${property}`;
          const evalPath = getEvalValuePath(fullPropertyPath, {
            isPopulated: false,
            fullPath: true,
          });

          setToEvalPathsIdenticalToState({
            evalPath,
            evalPathsIdenticalToState,
            evalProps,
            isParsedValueTheSame,
            statePath: fullPropertyPath,
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
              dataTree: tree as any,
              configTree,
            });
          }
        },
      );
    });
  });
}
