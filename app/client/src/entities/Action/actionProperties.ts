import { Action } from "entities/Action/index";
import _ from "lodash";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import {
  alternateViewTypeInputConfig,
  isHidden,
  ViewTypes,
} from "components/formControls/utils";
import {
  PaginationSubComponent,
  SortingSubComponent,
  WhereClauseSubComponent,
  allowedControlTypes,
  getViewType,
} from "components/formControls/utils";
import formControlTypes from "utils/formControl/formControlTypes";

const dynamicFields = [
  formControlTypes.QUERY_DYNAMIC_TEXT,
  formControlTypes.QUERY_DYNAMIC_INPUT_TEXT,
];

type ReactivePaths = Record<string, EvaluationSubstitutionType>;
type BindingPaths = ReactivePaths;
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

export const getBindingAndReactivePathsOfAction = (
  action: Action,
  formConfig?: any[],
): { reactivePaths: ReactivePaths; bindingPaths: BindingPaths } => {
  let reactivePaths: ReactivePaths = {
    data: EvaluationSubstitutionType.TEMPLATE,
    isLoading: EvaluationSubstitutionType.TEMPLATE,
    datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
  };
  const bindingPaths: BindingPaths = {};
  if (!formConfig) {
    reactivePaths = {
      ...reactivePaths,
      config: EvaluationSubstitutionType.TEMPLATE,
    };
    return {
      reactivePaths,
      bindingPaths,
    };
  }
  // NOTE:
  // there's a difference in how the bindingPaths should look when in component and json viewType mode.
  // for example in json mode, sorting component bindingPath should be formData.sortBy.data.(column | order)
  // in component mode, the sorting component binding path should be more specific e.g. formData.sortBy.data[0].(column | order)
  // the condition below checks if the viewType of the config and computes the binding path respectively
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
      } else if (
        // this else if checks the viewType and computes the binding path respectively(as explained above),
        // while the other else-ifs below checks specifically for component viewType mode.
        "alternateViewTypes" in formConfig &&
        Array.isArray(formConfig.alternateViewTypes) &&
        formConfig.alternateViewTypes.length > 0 &&
        formConfig.alternateViewTypes.includes(ViewTypes.JSON) &&
        getViewType(action, formConfig.configProperty) === ViewTypes.JSON
      ) {
        bindingPaths[configPath] = getCorrectEvaluationSubstitutionType(
          alternateViewTypeInputConfig().evaluationSubstitutionType,
        );
      } else if (formConfig.controlType === formControlTypes.ARRAY_FIELD) {
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
      } else if (formConfig.controlType === formControlTypes.WHERE_CLAUSE) {
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
      } else if (formConfig.controlType === formControlTypes.PAGINATION) {
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
      } else if (formConfig.controlType === formControlTypes.SORTING) {
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
      } else if (formConfig.controlType === formControlTypes.ENTITY_SELECTOR) {
        if (Array.isArray(formConfig.schema)) {
          formConfig.schema.forEach((schemaField: any) => {
            let columnPath = "";
            if (
              allowedControlTypes.includes(schemaField.controlType) &&
              !!schemaField.configProperty
            ) {
              columnPath = getBindingOrConfigPathsForEntitySelectorControl(
                schemaField.configProperty,
              );
            }
            bindingPaths[columnPath] = getCorrectEvaluationSubstitutionType(
              formConfig.evaluationSubstitutionType,
            );
          });
        }
      }
    }
  };
  formConfig.forEach(recursiveFindBindingPaths);
  reactivePaths = {
    ...reactivePaths,
    ...bindingPaths,
  };
  return { reactivePaths, bindingPaths };
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
): string => {
  // Entity selector schemas/components have their own distinct configProperties and have little to do with their parents(They are independent entities).
  return getDataTreeActionConfigPath(baseConfigProperty);
};

export const getDataTreeActionConfigPath = (propertyPath: string) =>
  propertyPath.replace("actionConfiguration.", "config.");
