import { ValidationConfig } from "constants/PropertyControlConstants";
import { Severity } from "entities/AppsmithConsole";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { get, isUndefined, set } from "lodash";
import {
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
  isPathADynamicTrigger,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import {
  addErrorToEntityProperty,
  getEntityNameAndPropertyPath,
  isWidget,
  removeFunctions,
  resetValidationErrorsForEntityProperty,
} from "workers/evaluationUtils";
import { validate } from "workers/validations";

export function validateAndParseWidgetProperty({
  currentTree,
  evalPropertyValue,
  fullPropertyPath,
  unEvalPropertyValue,
  widget,
}: {
  fullPropertyPath: string;
  widget: DataTreeWidget;
  currentTree: DataTree;
  evalPropertyValue: unknown;
  unEvalPropertyValue: string;
}): unknown {
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  if (isPathADynamicTrigger(widget, propertyPath)) {
    // TODO find a way to validate triggers
    return unEvalPropertyValue;
  }
  const validation = widget.validationPaths[propertyPath];

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
    resetValidationErrorsForEntityProperty(currentTree, fullPropertyPath);
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
    addErrorToEntityProperty(evalErrors, currentTree, fullPropertyPath);
  }
  // set evaluated value
  const safeEvaluatedValue = removeFunctions(evaluatedValue);
  set(
    widget,
    getEvalValuePath(fullPropertyPath, {
      isPopulated: false,
      fullPath: false,
    }),
    safeEvaluatedValue,
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

export function getValidatedTree(tree: DataTree) {
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey] as DataTreeWidget;
    if (!isWidget(entity)) {
      return tree;
    }
    const parsedEntity = { ...entity };
    Object.entries(entity.validationPaths).forEach(([property, validation]) => {
      const value = get(entity, property);
      // Pass it through parse
      const { isValid, messages, parsed, transformed } = validateWidgetProperty(
        validation,
        value,
        entity,
        property,
      );
      set(parsedEntity, property, parsed);
      const evaluatedValue = isValid
        ? parsed
        : isUndefined(transformed)
        ? value
        : transformed;
      const safeEvaluatedValue = removeFunctions(evaluatedValue);
      set(
        parsedEntity,
        getEvalValuePath(`${entityKey}.${property}`, {
          isPopulated: false,
          fullPath: false,
        }),
        safeEvaluatedValue,
      );
      if (!isValid) {
        const evalErrors: EvaluationError[] =
          messages?.map((message) => ({
            errorType: PropertyEvaluationErrorType.VALIDATION,
            errorMessage: message,
            severity: Severity.ERROR,
            raw: value,
          })) ?? [];
        addErrorToEntityProperty(
          evalErrors,
          tree,
          getEvalErrorPath(`${entityKey}.${property}`, {
            isPopulated: false,
            fullPath: false,
          }),
        );
      }
      // else {
      //   resetValidationErrorsForEntityProperty(
      //     tree,
      //     `${entityKey}.${property}`,
      //   );
      // }
    });
    return { ...tree, [entityKey]: parsedEntity };
  }, tree);
}
