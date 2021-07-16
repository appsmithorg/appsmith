import {
  DataTreeJSAction,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

export const generateDataTreeJSAction = (
  js: JSActionData,
): DataTreeJSAction => {
  const data: Record<string, unknown> = {};
  const meta: Record<string, unknown> = {};
  const dynamicBindingPathList = [];
  let result: any = {};
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  const variables = js?.config?.variables;
  if (variables) {
    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i];
      result[variable.name] = variable.value;
    }
  }
  const actions = js?.config?.actions;
  const subActionsObject: any = {};
  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      data[action.name] = null;
      subActionsObject[action.name] = action.actionConfiguration.body;
      meta[action.name] = {
        arguments: action.actionConfiguration.jsArguments,
      };
      bindingPaths[action.name] = EvaluationSubstitutionType.TEMPLATE;
      dynamicBindingPathList.push({ key: action.name });
    }
  }
  result = {
    ...result,
    name: js.config.name,
    pluginType: js.config.pluginType,
    data: data ? data : {},
    ENTITY_TYPE: ENTITY_TYPE.JSACTION,
    body: js.config.body,
    meta: meta,
    bindingPaths: bindingPaths,
    dynamicBindingPathList: dynamicBindingPathList,
  };

  return Object.assign(result, subActionsObject);
};
