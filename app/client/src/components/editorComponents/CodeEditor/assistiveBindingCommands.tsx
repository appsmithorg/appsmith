import React from "react";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import ReactDOM from "react-dom";
import sortBy from "lodash/sortBy";
import type { SlashCommandPayload } from "entities/Action";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import {
  Command,
  Shortcuts,
  commandsHeader,
  generateCreateNewCommand,
} from "./generateQuickCommands";

const matchingCommands = (
  list: any,
  searchText: string,
  recentEntities: string[] = [],
  limit = 5,
) => {
  list = list.filter((action: any) => {
    return (
      action.displayText.toLowerCase().indexOf(searchText.toLowerCase()) > -1
    );
  });
  list = sortBy(list, (a: any) => {
    return (
      (a.data.ENTITY_TYPE === ENTITY_TYPE.WIDGET
        ? recentEntities.indexOf(a.data.widgetId)
        : recentEntities.indexOf(a.data.actionId)) * -1
    );
  });
  return list.slice(0, limit);
};

export const generateAssistiveBindingCommands = (
  entitiesForSuggestions: any[],
  currentEntityType: ENTITY_TYPE,
  searchText: string,
  {
    pluginIdToImageLocation,
    recentEntities,
  }: {
    executeCommand: (payload: SlashCommandPayload) => void;
    pluginIdToImageLocation: Record<string, string>;
    recentEntities: string[];
    featureFlags: FeatureFlags;
    enableAIAssistance: boolean;
  },
) => {
  recentEntities.reverse();
  const newBinding: CommandsCompletion = generateCreateNewCommand({
    text: "{{}}",
    displayText: "Add a binding",
    description: "Connect data using JS",
    shortcut: Shortcuts.BINDING,
    triggerCompletionsPostPick: true,
  });

  const actionEntities = entitiesForSuggestions.filter((suggestion: any) => {
    return suggestion.type === ENTITY_TYPE.ACTION;
  });
  const suggestionsAction = actionEntities.map((suggestion: any) => {
    const name = suggestion.name;
    return {
      text: `{{${name}.data}}`,
      displayText: `${name}`,
      className: "CodeMirror-commands",
      data: suggestion,
      triggerCompletionsPostPick: suggestion.ENTITY_TYPE !== ENTITY_TYPE.ACTION,
      render: (element: HTMLElement, self: any, data: any) => {
        const pluginId = data.data.pluginId;
        let icon = null;
        if (pluginId && pluginIdToImageLocation[pluginId]) {
          icon = (
            <EntityIcon height="16px" width="16px">
              <img src={getAssetUrl(pluginIdToImageLocation[pluginId])} />
            </EntityIcon>
          );
        }
        ReactDOM.render(
          <Command
            desc={`{{${name}.data}}`}
            icon={icon}
            name={data.displayText}
          />,
          element,
        );
      },
    };
  });

  const jsActionEntities = entitiesForSuggestions.filter((suggestion: any) => {
    return suggestion.type === ENTITY_TYPE.JSACTION;
  });

  const suggestionsJSAction = jsActionEntities.flatMap((suggestion: any) => {
    const name = suggestion.name;
    const children = suggestion.children;
    const icon = JsFileIconV2(16, 16);
    return Object.keys(children).map((key: string) => {
      const isFunction = children[key].isfunction;
      const text = isFunction
        ? `{{${name}.${key}.data}}`
        : `{{${name}.${key}}}`;
      return {
        text: text,
        displayText: `${name}.${key}`,
        className: "CodeMirror-commands",
        description: text,
        data: suggestion,
        triggerCompletionsPostPick: false,
        render: (element: HTMLElement, self: any, data: any) => {
          ReactDOM.render(
            <Command desc={text} icon={icon} name={data.displayText} />,
            element,
          );
        },
      };
    });
  });

  const suggestions = [...suggestionsAction, ...suggestionsJSAction];

  const suggestionsMatchingSearchText = matchingCommands(
    suggestions,
    searchText,
    recentEntities,
    5,
  );
  const actionCommands = [newBinding];

  const actionCommandsMatchingSearchText = matchingCommands(
    actionCommands,
    searchText,
    [],
  );

  const list: CommandsCompletion[] = actionCommandsMatchingSearchText;

  if (suggestionsMatchingSearchText.length) {
    list.push(commandsHeader("Bind data", "", false));
  }
  list.push(...suggestionsMatchingSearchText);

  return list;
};
