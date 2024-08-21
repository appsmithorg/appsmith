import { EvaluationSubstitutionType, type DependencyMap } from "../common";
import { ENTITY_TYPE } from "./ee";

interface JSConfig {
  id: string;
  name: string;
  pluginType: "JS";
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
  variables?: {
    name: string;
    value: {
      name: string;
      value: unknown;
    };
  }[];
}

type JSUnEvalEntity = Record<string, unknown> & {
  ENTITY_TYPE: ENTITY_TYPE.JSACTION;
  actionId: string;
  body?: string;
};

interface JSConfigEntity {
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
  dynamicBindingPathList: Array<{ key: string }>;
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  variables: string[];
  dependencyMap: DependencyMap;
  pluginType: "JS";
  name: string;
  ENTITY_TYPE: ENTITY_TYPE.JSACTION;
  actionId: string;
  moduleId?: string;
  moduleInstanceId?: string;
  isPublic?: boolean;
}

export const generateDataTreeJSAction = (
  jsConfig: JSConfig,
): {
  unEvalEntity: JSUnEvalEntity;
  configEntity: JSConfigEntity;
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

  const { actions, body, id, name, pluginType, variables } = jsConfig;
  const listVariables: Array<string> = [];
  dynamicBindingPathList.push({ key: "body" });

  const removeThisReference =
    body && body.replace(/this\./g, `${jsConfig.name}.`);
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actionsData: Record<string, any> = {};
  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      meta[action.name] = {
        arguments: action.actionConfiguration?.jsArguments ?? [],
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
      actionId: id,
    },
    configEntity: {
      actionId: id,
      meta: meta,
      name,
      pluginType,
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      bindingPaths: bindingPaths, // As all js object function referred to as action is user javascript code, we add them as binding paths.
      reactivePaths: { ...bindingPaths },
      dynamicBindingPathList: dynamicBindingPathList,
      variables: listVariables,
      dependencyMap: dependencyMap,
    },
  };
};
