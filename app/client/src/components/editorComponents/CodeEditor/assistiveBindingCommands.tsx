import React from "react";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import ReactDOM from "react-dom";
import type { SlashCommandPayload } from "entities/Action";
import {
  type ENTITY_TYPE,
  ENTITY_TYPE_VALUE,
} from "entities/DataTree/dataTreeFactory";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import {
  Command,
  Shortcuts,
  commandsHeader,
  generateCreateNewCommand,
  matchingCommands,
} from "./generateQuickCommands";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { NavigationData } from "selectors/navigationSelectors";

export const generateAssistiveBindingCommands = (
  entitiesForSuggestions: NavigationData[],
  currentEntityType: ENTITY_TYPE,
  searchText: string,
  {
    expectedType,
    pluginIdToImageLocation,
  }: {
    executeCommand: (payload: SlashCommandPayload) => void;
    pluginIdToImageLocation: Record<string, string>;
    recentEntities: string[];
    featureFlags: FeatureFlags;
    enableAIAssistance: boolean;
    expectedType: AutocompleteDataType;
  },
) => {
  const newBinding: CommandsCompletion = generateCreateNewCommand({
    text: "{{}}",
    displayText: "Add a binding",
    description: "Connect data using JS",
    shortcut: Shortcuts.BINDING,
    triggerCompletionsPostPick: true,
  });

  const actionEntities = entitiesForSuggestions.filter((suggestion) => {
    return suggestion.type === ENTITY_TYPE_VALUE.ACTION;
  });

  const suggestionsAction = actionEntities.map((suggestion: any) => {
    const name = suggestion.name;
    const text =
      expectedType === AutocompleteDataType.FUNCTION
        ? `{{${name}.run()}}`
        : `{{${name}.data}}`;
    return {
      text,
      displayText: `${name}`,
      className: "CodeMirror-commands",
      data: suggestion,
      triggerCompletionsPostPick:
        suggestion.ENTITY_TYPE !== ENTITY_TYPE_VALUE.ACTION,
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
          <Command desc={text} icon={icon} name={data.displayText} />,
          element,
        );
      },
    };
  });

  const jsActionEntities = entitiesForSuggestions.filter((suggestion) => {
    return suggestion.type === ENTITY_TYPE_VALUE.JSACTION;
  });

  const suggestionsJSAction = jsActionEntities.flatMap((suggestion) => {
    const name = suggestion.name;
    const children = suggestion.children;
    const icon = JsFileIconV2(16, 16);
    return Object.keys(children).map((key: string) => {
      const isFunction = children[key].isfunction;
      const text = isFunction
        ? expectedType === AutocompleteDataType.FUNCTION
          ? `{{${name}.${key}()}}`
          : `{{${name}.${key}.data}}`
        : `{{${name}.${key}}}`;
      return {
        text,
        displayText: `${name}.${key}`,
        className: "CodeMirror-commands",
        description: text,
        data: suggestion,
        triggerCompletionsPostPick: false,
        render: (
          element: HTMLElement,
          _: unknown,
          data: CommandsCompletion,
        ) => {
          ReactDOM.render(
            <Command
              desc={text}
              icon={icon}
              name={data.displayText as string}
            />,
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
    5,
  );
  const actionCommands = [newBinding];

  const actionCommandsMatchingSearchText = matchingCommands(
    actionCommands,
    searchText,
  );

  const list = actionCommandsMatchingSearchText;

  if (suggestionsMatchingSearchText.length) {
    list.push(commandsHeader("Bind data", "", false));
  }
  list.push(...suggestionsMatchingSearchText);

  return list;
};
