import {
  DataTreeJSAction,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";

export const generateDataTreeJSAction = (
  js: JSActionData,
): DataTreeJSAction => {
  const data: any = {};
  const meta: any = {};
  let result: any = {};
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
  };

  return Object.assign(result, subActionsObject);
};
