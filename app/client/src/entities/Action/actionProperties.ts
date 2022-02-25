import { Action } from "entities/Action/index";
import _ from "lodash";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { isHidden } from "components/formControls/utils";
import {
  PaginationSubComponent,
  SortingSubComponent,
  WhereClauseSubComponent,
  allowedControlTypes,
} from "components/formControls/utils";

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
              const childrenPath = getBindingOrConfigPathsForWhereClauseControl(
                newConfigPath,
                WhereClauseSubComponent.Children,
                index,
              );
              recursiveFindBindingPathsForWhereClause(childrenPath, value);
            });
          } else {
            if (actionValue.hasOwnProperty("key")) {
              const keyPath = getBindingOrConfigPathsForWhereClauseControl(
                newConfigPath,
                WhereClauseSubComponent.Key,
                undefined,
              );
              bindingPaths[keyPath] = getCorrectEvaluationSubstitutionType(
                formConfig.evaluationSubstitutionType,
              );
            }
            if (actionValue.hasOwnProperty("value")) {
              const valuePath = getBindingOrConfigPathsForWhereClauseControl(
                newConfigPath,
                WhereClauseSubComponent.Value,
                undefined,
              );
              bindingPaths[valuePath] = getCorrectEvaluationSubstitutionType(
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
            const childrenPath = getBindingOrConfigPathsForWhereClauseControl(
              configPath,
              WhereClauseSubComponent.Children,
              index,
            );
            recursiveFindBindingPathsForWhereClause(childrenPath, value);
          });
        }
      } else if (formConfig.controlType === "PAGINATION") {
        const limitPath = getBindingOrConfigPathsForPaginationControl(
          PaginationSubComponent.Offset,
          configPath,
        );
        const offsetPath = getBindingOrConfigPathsForPaginationControl(
          PaginationSubComponent.Limit,
          configPath,
        );
        bindingPaths[limitPath] = getCorrectEvaluationSubstitutionType(
          formConfig.evaluationSubstitutionType,
        );
        bindingPaths[offsetPath] = getCorrectEvaluationSubstitutionType(
          formConfig.evaluationSubstitutionType,
        );
      } else if (formConfig.controlType === "SORTING") {
        const actionValue = _.get(action, formConfig.configProperty);
        if (Array.isArray(actionValue)) {
          actionValue.forEach((fieldConfig: any, index: number) => {
            const columnPath = getBindingOrConfigPathsForSortingControl(
              SortingSubComponent.Column,
              configPath,
              index,
            );
            bindingPaths[columnPath] = getCorrectEvaluationSubstitutionType(
              formConfig.evaluationSubstitutionType,
            );
            const OrderPath = getBindingOrConfigPathsForSortingControl(
              SortingSubComponent.Order,
              configPath,
              index,
            );
            bindingPaths[OrderPath] = getCorrectEvaluationSubstitutionType(
              formConfig.evaluationSubstitutionType,
            );
          });
        }
      } else if (formConfig.controlType === "ENTITY_SELECTOR") {
        if (Array.isArray(formConfig.schema)) {
          formConfig.schema.forEach((schemaField: any, index: number) => {
            if (allowedControlTypes.includes(schemaField.controlType)) {
              const columnPath = getBindingOrConfigPathsForEntitySelectorControl(
                configPath,
                index,
              );
              bindingPaths[columnPath] = getCorrectEvaluationSubstitutionType(
                formConfig.evaluationSubstitutionType,
              );
            }
          });
        }
      }
    }
  };
  formConfig.forEach(recursiveFindBindingPaths);
  return bindingPaths;
};

export const getBindingOrConfigPathsForSortingControl = (
  fieldName: SortingSubComponent.Order | SortingSubComponent.Column,
  baseConfigProperty: string,
  index?: number,
): string => {
  if (_.isNumber(index)) {
    return `${baseConfigProperty}[${index}].${fieldName}`;
  } else {
    return `${baseConfigProperty}.${fieldName}`;
  }
};

export const getBindingOrConfigPathsForPaginationControl = (
  fieldName: PaginationSubComponent.Limit | PaginationSubComponent.Offset,
  baseConfigProperty: string,
): string => {
  return `${baseConfigProperty}.${fieldName}`;
};

export const getBindingOrConfigPathsForWhereClauseControl = (
  configPath: string,
  fieldName:
    | WhereClauseSubComponent.Children
    | WhereClauseSubComponent.Condition
    | WhereClauseSubComponent.Key
    | WhereClauseSubComponent.Value,
  index?: number,
): string => {
  if (fieldName === "children" && _.isNumber(index)) {
    return `${configPath}.${fieldName}[${index}]`;
  } else if (configPath && fieldName) {
    return `${configPath}.${fieldName}`;
  }
  return "";
};

export const getBindingOrConfigPathsForEntitySelectorControl = (
  baseConfigProperty: string,
  index: number,
): string => {
  return `${baseConfigProperty}.column_${index + 1}`;
};

export const getDataTreeActionConfigPath = (propertyPath: string) =>
  propertyPath.replace("actionConfiguration.", "config.");
