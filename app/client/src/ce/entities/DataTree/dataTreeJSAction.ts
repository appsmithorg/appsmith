import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type {
  JSActionEntity,
  JSActionEntityConfig,
  MetaArgs,
} from "ee/entities/DataTree/types";

const reg = /this\./g;

export const generateDataTreeJSAction = (
  js: JSCollectionData,
): {
  unEvalEntity: JSActionEntity;
  configEntity: JSActionEntityConfig;
} => {
  const meta: Record<string, MetaArgs> = {};
  const dynamicBindingPathList = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variableList: Record<string, any> = {};
  const variables = js.config?.variables;
  const listVariables: Array<string> = [];

  dynamicBindingPathList.push({ key: "body" });

  const removeThisReference =
    js.config.body && js.config.body.replace(reg, `${js.config.name}.`);

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
