import { Action } from "entities/Action/index";
import _ from "lodash";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { isHidden } from "components/formControls/utils";

const dynamicFields = ["QUERY_DYNAMIC_TEXT", "QUERY_DYNAMIC_INPUT_TEXT"];

const getCorrectEvaluationSubstitutionType = (substitutionType?: string) => {
  if (substitutionType) {
    if (substitutionType === EvaluationSubstitutionType.SMART_SUBSTITUTE) {
      return EvaluationSubstitutionType.SMART_SUBSTITUTE;
    } else if (substitutionType === EvaluationSubstitutionType.PARAMETER) {
      return EvaluationSubstitutionType.PARAMETER;
    }
  }
  return EvaluationSubstitutionType.TEMPLATE;
};

export const getBindingPathsOfAction = (
  action: Action,
  formConfig?: any[],
): Record<string, EvaluationSubstitutionType> => {
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {
    data: EvaluationSubstitutionType.TEMPLATE,
    isLoading: EvaluationSubstitutionType.TEMPLATE,
    datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
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
      const configPath = getDataTreeActionConfigPath(formConfig.configProperty);
      if (dynamicFields.includes(formConfig.controlType)) {
        if (!isHidden(action, formConfig.hidden)) {
          bindingPaths[configPath] = getCorrectEvaluationSubstitutionType(
            formConfig.evaluationSubstitutionType,
          );
        }
      } else if (formConfig.controlType === "ARRAY_FIELD") {
        let actionValue = _.get(action, formConfig.configProperty);
        if (Array.isArray(actionValue)) {
          actionValue = actionValue.filter((val) => val);
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
                  formConfig.evaluationSubstitutionType,
                );
              }
            });
          }
        }
      } else if (formConfig.controlType === "WHERE_CLAUSE") {
        const recursiveFindBindingPathsForWhereClause = (
          newConfigPath: string,
          actionValue: any,
        ) => {
          if (
            actionValue &&
            actionValue.hasOwnProperty("children") &&
            Array.isArray(actionValue.children)
          ) {
            actionValue.children.forEach((value: any, index: number) => {
              recursiveFindBindingPathsForWhereClause(
                `${newConfigPath}.children[${index}]`,
                value,
              );
            });
          } else {
            if (actionValue.hasOwnProperty("key")) {
              bindingPaths[
                `${newConfigPath}.key`
              ] = getCorrectEvaluationSubstitutionType(
                formConfig.evaluationSubstitutionType,
              );
            }

            if (actionValue.hasOwnProperty("value")) {
              bindingPaths[
                `${newConfigPath}.value`
              ] = getCorrectEvaluationSubstitutionType(
                formConfig.evaluationSubstitutionType,
              );
            }
          }
        };

        const actionValue = _.get(action, formConfig.configProperty);
        if (
          actionValue &&
          actionValue.hasOwnProperty("children") &&
          Array.isArray(actionValue.children)
        ) {
          actionValue.children.forEach((value: any, index: number) => {
            recursiveFindBindingPathsForWhereClause(
              `${configPath}.children[${index}]`,
              value,
            );
          });
        }
      }
    }
  };

  formConfig.forEach(recursiveFindBindingPaths);

  return bindingPaths;
};

export const getDataTreeActionConfigPath = (propertyPath: string) =>
  propertyPath.replace("actionConfiguration.", "config.");
