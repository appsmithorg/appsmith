import {
  DataTreeJSAction,
  ENTITY_TYPE,
  MetaArgs,
} from "entities/DataTree/dataTreeFactory";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { DependencyMap } from "utils/DynamicBindingUtils";

export const generateDataTreeJSAction = (
  js: JSCollectionData,
): DataTreeJSAction => {
  const data: Record<string, unknown> = {};
  const meta: Record<string, MetaArgs> = {};
  const dynamicBindingPathList = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  let result: Record<string, unknown> = {};
  const variables = js.config.variables;
  const listVariables: Array<string> = [];
  dynamicBindingPathList.push({ key: "body" });
  bindingPaths["body"] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
  if (variables) {
    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i];
      result[variable.name] = variable.value;
      listVariables.push(variable.name);
    }
  }
  const dependencyMap: DependencyMap = {};
  dependencyMap["body"] = [];
  const actions = js.config.actions;
  const subActionsObject: any = {};
  if (actions) {
    const reg = /this\./g;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      data[action.name] = null;
      subActionsObject[
        action.name
      ] = action.actionConfiguration.body.replaceAll(reg, `${js.config.name}.`);
      meta[action.name] = {
        arguments: action.actionConfiguration.jsArguments,
      };
      bindingPaths[action.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
      dynamicBindingPathList.push({ key: action.name });
      dependencyMap["body"].push(action.name);
    }
  }
  result = {
    ...result,
    name: js.config.name,
    actionId: js.config.id,
    pluginType: js.config.pluginType,
    data: data ? data : {},
    ENTITY_TYPE: ENTITY_TYPE.JSACTION,
    body: js.config.body,
    meta: meta,
    bindingPaths: bindingPaths,
    dynamicBindingPathList: dynamicBindingPathList,
    variables: listVariables,
    dependencyMap: dependencyMap,
  };

  return Object.assign(result, subActionsObject);
};
