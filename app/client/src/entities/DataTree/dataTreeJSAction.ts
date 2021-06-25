import {
  DataTreeJSAction,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";

export const generateDataTreeJSAction = (
  js: JSActionData,
): DataTreeJSAction => {
  return {
    actionId: js.config.id,
    name: js.config.name,
    pluginType: js.config.pluginType,
    data: js.data ? js.data.body : {},
    ENTITY_TYPE: ENTITY_TYPE.JSACTION,
    actions: js.config.actions,
    variables: js.config.variables,
    body: js.config.body,
  };
};
