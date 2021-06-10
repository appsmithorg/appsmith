import { createReducer } from "utils/AppsmithUtils";
import { PluginType, JSSubAction } from "entities/Action";

export interface JsPaneReduxState {
  pluginType: PluginType.JS;
  name: string;
  variables: any;
  body: string;
  actions: Array<JSSubAction>;
  pageId: string;
  organizationId: string;
  pluginId: string;
  actionConfiguration: any;
  id: string;
}

const initialState: JsPaneReduxState = {
  id: "1234567890",
  pluginType: PluginType.JS,
  pageId: "60af589ae46b4f17edc130fe",
  name: "getUserDetails",
  organizationId: "606596fa6e42981cc3204bfe",
  pluginId: "5678",
  variables: [{ name: "getUserDetails.data", initialValue: "undefined" }],
  body: "class getUserDetails {const data;}",
  actionConfiguration: {
    body: "class getUserDetails {const data;}",
  },
  actions: [
    {
      actionId: "function_action_id",
      name: "getUserDetails.all",
      parentObjectId: "unknown_collection_parent_id",
      executeOnLoad: false,
      actionConfiguration: {
        body: "function all(){...}",
        isAsync: true,
        arguments: [],
        timeoutInMilliseconds: 3000,
      },
    },
  ],
};

const jsPaneReducer = createReducer(initialState, {});

export default jsPaneReducer;
