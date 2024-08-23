import type { Action } from "entities/Action/index";
import get from "lodash/get";
import {
  convertPathToString,
  EvaluationSubstitutionType,
  getAllBindingPathsForGraphqlPagination,
} from "@appsmith/evaluation";
import {
  ViewTypes,
  PaginationSubComponent,
  FormControlTypes,
  SortingSubComponent,
  WhereClauseSubComponent,
  EditorControlTypes,
  ENTITY_SELECTOR_CONTROL_TYPES,
} from "@appsmith/types";
import { getFormControlViewType, isFormControlHidden } from "@appsmith/utils";

const dynamicFields = [
  FormControlTypes.QUERY_DYNAMIC_TEXT,
  FormControlTypes.QUERY_DYNAMIC_INPUT_TEXT,
];

type ReactivePaths = Record<string, EvaluationSubstitutionType>;
type BindingPaths = ReactivePaths;
const getCorrectEvaluationSubstitutionType = (substitutionType?: string) => {
  switch (substitutionType) {
    case EvaluationSubstitutionType.SMART_SUBSTITUTE:
      return EvaluationSubstitutionType.SMART_SUBSTITUTE;
    case EvaluationSubstitutionType.PARAMETER:
      return EvaluationSubstitutionType.PARAMETER;
    default:
      return EvaluationSubstitutionType.TEMPLATE;
  }
};

export const getBindingAndReactivePathsOfAction = (
  action: Action,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formConfig?: any[],
  dynamicBindingPathList?: {
    key: string;
    value?: string;
  }[],
): { reactivePaths: ReactivePaths; bindingPaths: BindingPaths } => {
  let reactivePaths: ReactivePaths = {
    data: EvaluationSubstitutionType.TEMPLATE,
    isLoading: EvaluationSubstitutionType.TEMPLATE,
    datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
  };
  const bindingPaths: BindingPaths = {};
  if (!formConfig) {
    dynamicBindingPathList?.forEach((dynamicPath) => {
      reactivePaths[dynamicPath.key] = EvaluationSubstitutionType.TEMPLATE;
    });
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recursiveFindBindingPaths = (formConfig: any) => {
    if (formConfig.children) {
      formConfig.children.forEach(recursiveFindBindingPaths);
    } else {
      const configPath = renameActionConfigToConfig(formConfig.configProperty);
      if (dynamicFields.includes(formConfig.controlType)) {
        if (!isFormControlHidden(action, formConfig.hidden)) {
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
        getFormControlViewType(action, formConfig.configProperty) ===
          ViewTypes.JSON
      ) {
        bindingPaths[configPath] = EvaluationSubstitutionType.TEMPLATE;
      } else if (formConfig.controlType === FormControlTypes.ARRAY_FIELD) {
        let actionValue = get(action, formConfig.configProperty);
        if (Array.isArray(actionValue)) {
          actionValue = actionValue.filter((val) => val);
          for (let i = 0; i < actionValue.length; i++) {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formConfig.schema.forEach((schemaField: any) => {
              if (
                schemaField.key in actionValue[i] &&
                dynamicFields.includes(schemaField.controlType)
              ) {
                const arrayConfigPath = `${configPath}[${i}].${schemaField.key}`;
                bindingPaths[arrayConfigPath] =
                  getCorrectEvaluationSubstitutionType(
                    formConfig.evaluationSubstitutionType,
                  );
              }
            });
          }
        }
      } else if (formConfig.controlType === FormControlTypes.WHERE_CLAUSE) {
        const recursiveFindBindingPathsForWhereClause = (
          newConfigPath: string,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          actionValue: any,
        ) => {
          if (
            actionValue &&
            actionValue.hasOwnProperty("children") &&
            Array.isArray(actionValue.children)
          ) {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            actionValue.children.forEach((value: any, index: number) => {
              const childrenPath = convertPathToString([
                newConfigPath,
                WhereClauseSubComponent.Children,
                index,
              ]);
              recursiveFindBindingPathsForWhereClause(childrenPath, value);
            });
          } else {
            if (actionValue.hasOwnProperty("key")) {
              const keyPath = convertPathToString([
                newConfigPath,
                WhereClauseSubComponent.Key,
              ]);
              bindingPaths[keyPath] = getCorrectEvaluationSubstitutionType(
                formConfig.evaluationSubstitutionType,
              );
            }
            if (actionValue.hasOwnProperty("value")) {
              const valuePath = convertPathToString([
                newConfigPath,
                WhereClauseSubComponent.Value,
              ]);
              bindingPaths[valuePath] = getCorrectEvaluationSubstitutionType(
                formConfig.evaluationSubstitutionType,
              );
            }
          }
        };

        const actionValue = get(action, formConfig.configProperty);
        if (
          actionValue &&
          actionValue.hasOwnProperty("children") &&
          Array.isArray(actionValue.children)
        ) {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          actionValue.children.forEach((value: any, index: number) => {
            const childrenPath = convertPathToString([
              configPath,
              WhereClauseSubComponent.Children,
              index,
            ]);
            recursiveFindBindingPathsForWhereClause(childrenPath, value);
          });
        }
      } else if (formConfig.controlType === FormControlTypes.PAGINATION) {
        const limitPath = convertPathToString([
          configPath,
          PaginationSubComponent.Offset,
        ]);
        const offsetPath = convertPathToString([
          configPath,
          PaginationSubComponent.Limit,
        ]);
        bindingPaths[limitPath] = getCorrectEvaluationSubstitutionType(
          formConfig.evaluationSubstitutionType,
        );
        bindingPaths[offsetPath] = getCorrectEvaluationSubstitutionType(
          formConfig.evaluationSubstitutionType,
        );
      } else if (formConfig.controlType === FormControlTypes.SORTING) {
        const actionValue = get(action, formConfig.configProperty);
        if (Array.isArray(actionValue)) {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          actionValue.forEach((fieldConfig: any, index: number) => {
            const columnPath = convertPathToString([
              configPath,
              index,
              SortingSubComponent.Column,
            ]);
            bindingPaths[columnPath] = getCorrectEvaluationSubstitutionType(
              formConfig.evaluationSubstitutionType,
            );
            const OrderPath = convertPathToString([
              configPath,
              index,
              SortingSubComponent.Order,
            ]);
            bindingPaths[OrderPath] = getCorrectEvaluationSubstitutionType(
              formConfig.evaluationSubstitutionType,
            );
          });
        }
      } else if (formConfig.controlType === FormControlTypes.ENTITY_SELECTOR) {
        if (Array.isArray(formConfig.schema)) {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formConfig.schema.forEach((schemaField: any) => {
            let columnPath = "";
            if (
              ENTITY_SELECTOR_CONTROL_TYPES.includes(schemaField.controlType) &&
              !!schemaField.configProperty
            ) {
              columnPath = renameActionConfigToConfig(
                schemaField.configProperty,
              );
            }
            bindingPaths[columnPath] = getCorrectEvaluationSubstitutionType(
              formConfig.evaluationSubstitutionType,
            );
          });
        }
      } else if (
        formConfig.controlType === EditorControlTypes.E_GRAPHQL_PAGINATION
      ) {
        const allPaths = getAllBindingPathsForGraphqlPagination(configPath);
        allPaths.forEach(({ key, value }) => {
          if (key && value) {
            bindingPaths[key] = value as EvaluationSubstitutionType;
          }
        });
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

export const renameActionConfigToConfig = (propertyPath: string) =>
  propertyPath.replace("actionConfiguration.", "config.");
