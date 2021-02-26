import { Action, PluginType } from "entities/Action/index";
import { transformRestAction } from "transformers/RestActionTransformer";
import _ from "lodash";

type transformer = (action: Action) => Action;

const transformers: Record<PluginType, transformer> = {
  [PluginType.API]: transformRestAction,
  [PluginType.DB]: (action) => action,
};

const actionTransformer = (action: Action): Action => {
  let transformedAction = _.cloneDeep(action);
  if (action.pluginType in transformers) {
    transformedAction = transformers[action.pluginType](action);
  }
  return transformedAction;
};
