import { Action } from "entities/Action/index";
import _ from "lodash";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

const dynamicFields = [
  "QUERY_DYNAMIC_TEXT",
  "QUERY_DYNAMIC_INPUT_TEXT",
  "SMART_SUBSTITUTION_DYNAMIC_TEXT",
  "PREPARED_STATEMENT_DYNAMIC_TEXT",
];

const getCorrectEvaluationSubstitutionType = (controlType: string) => {
  if (controlType === "SMART_SUBSTITUTION_DYNAMIC_TEXT") {
    return EvaluationSubstitutionType.SMART_SUBSTITUTE;
  } else if (controlType === "PREPARED_STATEMENT_DYNAMIC_TEXT") {
    return EvaluationSubstitutionType.PARAMETER;
  } else {
    return EvaluationSubstitutionType.TEMPLATE;
  }
};

export const getBindingPathsOfAction = (
  action: Action,
  formConfig?: any[],
): Record<string, EvaluationSubstitutionType> => {
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {
    data: EvaluationSubstitutionType.TEMPLATE,
    isLoading: EvaluationSubstitutionType.TEMPLATE,
  };
  if (!formConfig) {
    return {
      ...bindingPaths,
      config: EvaluationSubstitutionType.TEMPLATE,
    };
  }
  const recursiveFindBindingPaths = (formConfig: any) => {
    if (formConfig.children) {
      formConfig.children.forEach(recursiveFindBindingPaths);
    } else {
      const configPath = formConfig.configProperty.replace(
        "actionConfiguration.",
        "config.",
      );
      if (dynamicFields.includes(formConfig.controlType)) {
        bindingPaths[configPath] = getCorrectEvaluationSubstitutionType(
          formConfig.controlType,
        );
      }
      if (formConfig.controlType === "ARRAY_FIELD") {
        const actionValue = _.get(action, formConfig.configProperty);
        if (Array.isArray(actionValue)) {
          for (let i = 0; i < actionValue.length; i++) {
            formConfig.schema.forEach((schemaField: any) => {
              if (
                schemaField.key in actionValue[i] &&
                dynamicFields.includes(schemaField.controlType)
              ) {
                const arrayConfigPath = `${configPath}[${i}].${schemaField.key}`;
                bindingPaths[
                  arrayConfigPath
                ] = getCorrectEvaluationSubstitutionType(
                  formConfig.controlType,
                );
              }
            });
          }
        }
      }
    }
  };

  formConfig.forEach(recursiveFindBindingPaths);

  return bindingPaths;
};
