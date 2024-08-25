import get from "lodash/get";
import {
  convertPathToString,
  EvaluationSubstitutionType,
  type DependencyMap,
} from "../../common";
import { ENTITY_TYPE } from "@appsmith/types";
import type { PluginType } from "@appsmith/types";
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
import { getAllBindingPathsForGraphqlPagination } from "../../dynamicBinding";

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
  action: {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actionConfiguration: any;
  },
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

export const generateDataTreeAction = (
  action: {
    isLoading: boolean;
    config: {
      id: string;
      name: string;
      pluginId: string;
      dynamicBindingPathList: { key: string; value?: string }[];
      datasource: { datasourceConfiguration?: { url?: string } };
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actionConfiguration: any;
      pluginType: PluginType;
    };
    data?: {
      statusCode: string;
      isExecutionSuccess?: boolean;
      headers: Record<string, string[]>;
    };
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorConfig: any[],
  dependencyConfig: DependencyMap = {},
): {
  unEvalEntity: {
    actionId: string;
    run: Record<string, unknown>;
    clear: Record<string, unknown>;
    data: unknown;
    isLoading: boolean;
    responseMeta: {
      statusCode?: string;
      isExecutionSuccess: boolean;
      headers?: unknown;
    };
    config: Record<string, unknown>;
    ENTITY_TYPE: typeof ENTITY_TYPE.ACTION;
    datasourceUrl: string;
  };
  configEntity: {
    dynamicBindingPathList: { key: string; value?: string }[];
    bindingPaths: Record<string, EvaluationSubstitutionType>;
    reactivePaths: Record<string, EvaluationSubstitutionType>;
    ENTITY_TYPE: ENTITY_TYPE.ACTION;
    dependencyMap: DependencyMap;
    logBlackList: Record<string, true>;
    pluginId: string;
    pluginType: PluginType;
    actionId: string;
    name: string;
    moduleId?: string;
    moduleInstanceId?: string;
    isPublic?: boolean;
    __setters?: Record<string, unknown>;
  };
} => {
  let dynamicBindingPathList: {
    key: string;
    value?: string;
  }[] = [];
  let datasourceUrl = "";

  // update paths
  if (
    action.config.dynamicBindingPathList &&
    action.config.dynamicBindingPathList.length
  ) {
    dynamicBindingPathList = action.config.dynamicBindingPathList.map((d) => ({
      ...d,
      key: d.key === "datasourceUrl" ? d.key : `config.${d.key}`,
    }));
  }

  if (
    action.config.datasource &&
    "datasourceConfiguration" in action.config.datasource
  ) {
    datasourceUrl = action.config.datasource.datasourceConfiguration?.url ?? "";
  }

  const dependencyMap: DependencyMap = {};
  Object.entries(dependencyConfig).forEach(([dependent, dependencies]) => {
    dependencyMap[renameActionConfigToConfig(dependent)] = dependencies.map(
      renameActionConfigToConfig,
    );
  });

  const { bindingPaths, reactivePaths } = getBindingAndReactivePathsOfAction(
    action.config,
    editorConfig,
    dynamicBindingPathList,
  );

  return {
    unEvalEntity: {
      actionId: action.config.id,
      run: {},
      clear: {},
      // Data is always set to undefined in the unevalTree
      // Action data is updated directly to the dataTree (see updateActionData.ts)
      data: undefined,
      isLoading: action.isLoading,
      responseMeta: {
        statusCode: action.data?.statusCode,
        isExecutionSuccess: action.data?.isExecutionSuccess ?? false,
        headers: action.data?.headers,
      },
      config: action.config.actionConfiguration,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      datasourceUrl,
    },
    configEntity: {
      actionId: action.config.id,
      name: action.config.name,
      pluginId: action.config.pluginId,
      pluginType: action.config.pluginType,
      dynamicBindingPathList,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      bindingPaths,
      reactivePaths,
      dependencyMap,
      logBlackList: {},
    },
  };
};
