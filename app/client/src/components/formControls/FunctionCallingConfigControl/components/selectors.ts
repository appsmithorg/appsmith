import {
  getActions,
  getJSCollections,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import { createSelector } from "reselect";
import { getCurrentPageId } from "selectors/editorSelectors";
import type {
  FunctionCallingEntityType,
  FunctionCallingEntityTypeOption,
  JSCollectionOption,
  FunctionCallingConfigFormToolField,
} from "../types";
import { getAgentChatQuery } from "ee/selectors/aiAgentSelectors";
import get from "lodash/get";
import keyBy from "lodash/keyBy";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";

export const selectEntityOptions = createSelector(
  getActions,
  getJSCollections,
  getAgentChatQuery,
  getCurrentPageId,
  getPlugins,
  (
    actions,
    jsCollections,
    agentChatQuery: ActionData | undefined,
    currentPageId,
    plugins,
  ): Record<FunctionCallingEntityType, FunctionCallingEntityTypeOption[]> & {
    JSCollections: JSCollectionOption[];
    agentFunctions: Record<string, FunctionCallingConfigFormToolField>;
  } => {
    const agentFunctions: Record<string, FunctionCallingConfigFormToolField> =
      keyBy(
        get(
          agentChatQuery,
          "config.actionConfiguration.formData.aiChatAssistant.input.functions",
          [],
        ),
        "entityId",
      );
    const pluginGroups = keyBy(plugins, "id");

    const queryItems = actions
      .filter((action) => action.config.id !== agentChatQuery?.config.id)
      .filter((action) => action.config.pageId === currentPageId)
      .map((action) => {
        const config = getActionConfig(action.config.pluginType);
        const icon = config?.getIcon(
          action,
          pluginGroups[action.config.pluginId],
        );

        return {
          value: action.config.id,
          label: action.config.name,
          optionGroupType: "Query",
          icon,
        };
      });

    // Create a nested structure of JS Collections and their functions
    const jsCollectionItems = jsCollections
      .filter((jsCollection) => jsCollection.config.pageId === currentPageId)
      .map((jsCollection) => {
        // Get all functions without filtering
        const jsFunctions = jsCollection.config.actions.map((jsFunction) => ({
          value: jsFunction.id,
          label: jsFunction.name,
          optionGroupType: "JSFunction",
          parentId: jsCollection.config.id,
        }));

        return {
          id: jsCollection.config.id,
          name: jsCollection.config.name,
          functions: jsFunctions,
          icon: JsFileIconV2(16, 16),
        };
      })
      // Keep all collections, even if all their functions are used
      .filter((collection) => collection.functions.length > 0);

    // Flatten JS functions for backward compatibility
    const jsItems = jsCollectionItems.flatMap(
      (collection) => collection.functions,
    );

    return {
      Query: queryItems,
      JSFunction: jsItems,
      JSCollections: jsCollectionItems,
      agentFunctions,
    };
  },
);
