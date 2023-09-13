import React from "react";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import ReactDOM from "react-dom";
import sortBy from "lodash/sortBy";
import type { SlashCommandPayload } from "entities/Action";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { Icon } from "design-system";
import BetaCard from "../BetaCard";
import { commandsHeader } from "./generateQuickCommands";

enum Shortcuts {
  PLUS = "PLUS",
  BINDING = "BINDING",
  FUNCTION = "FUNCTION",
  ASK_AI = "ASK_AI",
}

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

const generateCreateNewCommand = ({
  action,
  description,
  displayText,
  isBeta,
  shortcut,
  text,
  triggerCompletionsPostPick,
}: any): CommandsCompletion => ({
  text,
  displayText: displayText,
  data: { doc: "" },
  origin: "",
  type: AutocompleteDataType.UNKNOWN,
  className: "CodeMirror-commands",
  shortcut,
  action,
  triggerCompletionsPostPick,
  render: (element: HTMLElement, self: any, data: any) => {
    ReactDOM.render(
      <Command
        desc={description}
        icon={iconsByType[data.shortcut as Shortcuts]}
        isBeta={isBeta}
        name={data.displayText}
      />,
      element,
    );
  },
});

const iconsByType = {
  [Shortcuts.BINDING]: <Icon name="binding-new" size="md" />,
  [Shortcuts.PLUS]: (
    <Icon className="add-datasource-icon" name="add-box-line" size="md" />
  ),
  [Shortcuts.FUNCTION]: (
    <Icon className="snippet-icon" name="snippet" size="md" />
  ),
  [Shortcuts.ASK_AI]: <Icon className="magic" name="magic-line" size="md" />,
};

function Command(props: {
  icon: any;
  name: string;
  desc?: string;
  isBeta?: boolean;
}) {
  return (
    <div className="command-container">
      <div className="command">
        {props.icon}
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap flex flex-row items-center gap-2">
          {props.name}
          {props.isBeta && <BetaCard />}
        </div>
      </div>
      {props.desc ? <div className="command-desc">{props.desc}</div> : null}
    </div>
  );
}

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
    displayText: "Add binding",
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
            <EntityIcon>
              <img src={getAssetUrl(pluginIdToImageLocation[pluginId])} />
            </EntityIcon>
          );
        }
        ReactDOM.render(
          <Command icon={icon} name={data.displayText} />,
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
    return Object.keys(children).map((key: string) => {
      const isFunction = children[key].isfunction;
      const text = isFunction
        ? `{{${name}.${key}.data}}`
        : `{{${name}.${key}}}`;
      return {
        text: text,
        displayText: `${name}.${key}`,
        className: "CodeMirror-commands",
        data: suggestion,
        triggerCompletionsPostPick: false,
        render: (element: HTMLElement, self: any, data: any) => {
          const icon = JsFileIconV2();
          ReactDOM.render(
            <Command icon={icon} name={data.displayText} />,
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
    list.push(commandsHeader("Bind data", "", list.length > 0));
  }
  list.push(...suggestionsMatchingSearchText);

  return list;
};
