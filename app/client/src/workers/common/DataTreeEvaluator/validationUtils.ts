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
  getEvalErrorPath,
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
  if (isValid) {
    evaluatedValue = parsed;
    // remove validation errors is already present
    resetValidationErrorsForEntityProperty({
      evalProps,
      fullPropertyPath,
    });
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

export function getValidatedTree(
  tree: DataTree,
  option: { evalProps: EvalProps },
  configTree: ConfigTree,
) {
  const { evalProps } = option;
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey];
    if (!isWidget(entity)) {
      return tree;
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
        set(
          evalProps,
          getEvalValuePath(`${entityKey}.${property}`, {
            isPopulated: false,
            fullPath: true,
          }),
          evaluatedValue,
        );
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
            fullPropertyPath: getEvalErrorPath(`${entityKey}.${property}`, {
              isPopulated: false,
              fullPath: true,
            }),
            dataTree: tree,
            configTree,
          });
        }
      },
    );
    return { ...tree, [entityKey]: entity };
  }, tree);
}
