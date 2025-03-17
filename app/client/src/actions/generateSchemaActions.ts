import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { JSAction } from "entities/JSCollection";

export const generateJSFunctionSchema = (action: JSAction) => {
  return {
    type: ReduxActionTypes.GENERATE_JS_FUNCTION_SCHEMA_REQUEST,
    payload: {
      action,
    },
  };
};

export const generatePluginActionSchema = (id: string) => {
  return {
    type: ReduxActionTypes.GENERATE_PLUGIN_ACTION_SCHEMA_REQUEST,
    payload: { id },
  };
};
