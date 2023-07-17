import type { ValidationConfig } from "constants/PropertyControlConstants";
import { Severity } from "entities/AppsmithConsole";
import type {
  ConfigTree,
  DataTree,
  WidgetEntity,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import { get, isUndefined, set } from "lodash";
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
import type DataTreeEvaluator from ".";

export function validateAndParseWidgetProperty({
  configTree,
  currentTree,
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
  set(
    evalProps,
    getEvalValuePath(fullPropertyPath, {
      isPopulated: false,
      fullPath: true,
    }),
    evaluatedValue,
  );

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
) {
  if (!config) {
    return {
      isValid: true,
      parsed: value,
    };
  }
  return validate(config, value, {}, "");
}

export function reValidateEvalOrderDependentPaths(
  evaluationOrder: string[],
  evalTree: DataTree,
  option: { evalProps: EvalProps; dataTreeEvaluator: DataTreeEvaluator },
  configTree: ConfigTree,
) {
  const { dataTreeEvaluator, evalProps } = option;

  for (const fullPropertyPath of evaluationOrder) {
    const { entityName } = getEntityNameAndPropertyPath(fullPropertyPath);

    const entity = evalTree[entityName];

    if (!isWidget(entity) || !dataTreeEvaluator) continue;

    const pathsToRevalidate =
      dataTreeEvaluator.inverseValidationDependencyMap[fullPropertyPath] || [];
    pathsToRevalidate.forEach((fullPath) => {
      validateAndParseWidgetProperty({
        fullPropertyPath: fullPath,
        widget: entity,
        currentTree: evalTree,
        configTree,
        // we supply non-transformed evaluated value
        evalPropertyValue: get(
          dataTreeEvaluator?.getUnParsedEvalTree(),
          fullPath,
        ),
        unEvalPropertyValue: get(
          dataTreeEvaluator?.oldUnEvalTree,
          fullPath,
        ) as unknown as string,
        evalProps,
      });
    });
  }
}
