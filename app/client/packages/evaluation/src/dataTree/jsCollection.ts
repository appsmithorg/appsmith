import { EvaluationSubstitutionType, type DependencyMap } from "../common";
import { ENTITY_TYPE } from "./ee";

export const generateDataTreeJSAction = (js: {
  isLoading: boolean;
  config: {
    id: string;
    name: string;
    pluginType: string;
    body?: string;
    actions?: Array<{
      name: string;
      confirmBeforeExecute?: boolean;
      actionConfiguration?: {
        jsArguments?: {
          name: string;
          value: unknown;
        }[];
      };
    }>;
    variables?: Array<{
      name: string;
      value: {
        name: string;
        value: unknown;
      };
    }>;
  };
  data?: Record<string, unknown>;
  isExecuting?: Record<string, boolean>;
  activeJSActionId?: string;
  // Existence of parse errors for each action (updates after execution)
  isDirty?: Record<string, boolean>;
}): {
  unEvalEntity: Record<string, unknown> & {
    ENTITY_TYPE: ENTITY_TYPE.JSACTION;
    actionId: string;
    body?: string;
  };
  configEntity: {
    actionId: string;
    meta: Record<
      string,
      {
        arguments: {
          name: string;
          value: unknown;
        }[];
        confirmBeforeExecute: boolean;
      }
    >;
    name: string;
    pluginType: string;
    ENTITY_TYPE: ENTITY_TYPE.JSACTION;
    bindingPaths: Record<string, EvaluationSubstitutionType>;
    reactivePaths: Record<string, EvaluationSubstitutionType>;
    dynamicBindingPathList: Array<{ key: string }>;
    variables: string[];
    dependencyMap: DependencyMap;
  };
} => {
  const meta: Record<
    string,
    {
      arguments: {
        name: string;
        value: unknown;
      }[];
      confirmBeforeExecute: boolean;
    }
  > = {};
  const dynamicBindingPathList = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variableList: Record<string, any> = {};
  const variables = js.config?.variables;
  const listVariables: Array<string> = [];
  dynamicBindingPathList.push({ key: "body" });

  const removeThisReference =
    js.config.body && js.config.body.replace(/this\./g, `${js.config.name}.`);
  bindingPaths["body"] = EvaluationSubstitutionType.SMART_SUBSTITUTE;

  if (variables) {
    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i];
      variableList[variable.name] = variable.value;
      listVariables.push(variable.name);
      dynamicBindingPathList.push({ key: variable.name });
      bindingPaths[variable.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
    }
  }
  const dependencyMap: DependencyMap = {};
  dependencyMap["body"] = [];
  const actions = js.config.actions;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actionsData: Record<string, any> = {};
  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      meta[action.name] = {
        arguments: action.actionConfiguration?.jsArguments || [],
        confirmBeforeExecute: !!action.confirmBeforeExecute,
      };
      bindingPaths[action.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
      dynamicBindingPathList.push({ key: action.name });
      dependencyMap["body"].push(action.name);
      actionsData[action.name] = {
        // Data is always set to {} in the unevalTree
        // Action data is updated directly to the dataTree (see updateActionData.ts)
        data: {},
      };
    }
  }
  return {
    unEvalEntity: {
      ...variableList,
      ...actionsData,
      body: removeThisReference,
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      actionId: js.config.id,
    },
    configEntity: {
      actionId: js.config.id,
      meta: meta,
      name: js.config.name,
      pluginType: js.config.pluginType,
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      bindingPaths: bindingPaths, // As all js object function referred to as action is user javascript code, we add them as binding paths.
      reactivePaths: { ...bindingPaths },
      dynamicBindingPathList: dynamicBindingPathList,
      variables: listVariables,
      dependencyMap: dependencyMap,
    },
  };
};
