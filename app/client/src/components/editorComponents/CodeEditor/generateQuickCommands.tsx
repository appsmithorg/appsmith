import type { Datasource } from "entities/Datasource";
import React from "react";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import ReactDOM from "react-dom";
import sortBy from "lodash/sortBy";
import type { SlashCommandPayload } from "entities/Action";
import { PluginType, SlashCommand } from "entities/Action";
import { ReactComponent as Binding } from "assets/icons/menu/binding.svg";
import { ReactComponent as Snippet } from "assets/icons/ads/snippet.svg";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import AddDatasourceIcon from "remixicon-react/AddBoxLineIcon";
import { Colors } from "constants/Colors";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import MagicIcon from "remixicon-react/MagicLineIcon";
import { addAISlashCommand } from "@appsmith/components/editorComponents/GPT/trigger";
import type FeatureFlags from "entities/FeatureFlags";

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
    return action.displayText
      .toLowerCase()
      .startsWith(searchText.toLowerCase());
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

const commandsHeader = (
  displayText: string,
  text = "",
): CommandsCompletion => ({
  text: text,
  displayText: displayText,
  className: "CodeMirror-command-header",
  data: { doc: "" },
  origin: "",
  type: AutocompleteDataType.UNKNOWN,
  isHeader: true,
  shortcut: "",
});

const generateCreateNewCommand = ({
  action,
  displayText,
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
        icon={iconsByType[data.shortcut as Shortcuts]}
        name={data.displayText}
      />,
      element,
    );
  },
});

const iconsByType = {
  [Shortcuts.BINDING]: (
    <EntityIcon noBorder>
      <Binding className="shortcut" />
    </EntityIcon>
  ),
  [Shortcuts.PLUS]: (
    <AddDatasourceIcon
      className="add-datasource-icon"
      color={Colors.DOVE_GRAY2}
      size={18}
    />
  ),
  [Shortcuts.FUNCTION]: (
    <EntityIcon noBorder>
      <Snippet className="snippet-icon shortcut" />
    </EntityIcon>
  ),
  [Shortcuts.ASK_AI]: (
    <EntityIcon noBorder>
      <MagicIcon className="magic" />
    </EntityIcon>
  ),
};

function Command(props: { icon: any; name: string }) {
  return (
    <div className="command-container">
      <div className="command">
        {props.icon}
        <span className="ml-1 overflow-hidden overflow-ellipsis whitespace-nowrap">
          {props.name}
        </span>
      </div>
    </div>
  );
}

export const generateQuickCommands = (
  entitiesForSuggestions: any[],
  currentEntityType: ENTITY_TYPE,
  searchText: string,
  {
    datasources,
    executeCommand,
    featureFlags,
    pluginIdToImageLocation,
    recentEntities,
  }: {
    datasources: Datasource[];
    executeCommand: (payload: SlashCommandPayload) => void;
    pluginIdToImageLocation: Record<string, string>;
    recentEntities: string[];
    featureFlags: FeatureFlags;
  },
  expectedType: string,
  entityId: any,
  propertyPath: any,
) => {
  const suggestionsHeader: CommandsCompletion = commandsHeader("Bind Data");
  const createNewHeader: CommandsCompletion = commandsHeader("Create a Query");
  recentEntities.reverse();
  const newBinding: CommandsCompletion = generateCreateNewCommand({
    text: "{{}}",
    displayText: "New Binding",
    shortcut: Shortcuts.BINDING,
    triggerCompletionsPostPick: true,
  });
  const insertSnippet: CommandsCompletion = generateCreateNewCommand({
    text: "",
    displayText: "Insert Snippet",
    shortcut: Shortcuts.FUNCTION,
    action: () =>
      executeCommand({
        actionType: SlashCommand.NEW_SNIPPET,
        args: {
          entityType: currentEntityType,
          expectedType: expectedType,
          entityId: entityId,
          propertyPath: propertyPath,
        },
      }),
  });
  const newIntegration: CommandsCompletion = generateCreateNewCommand({
    text: "",
    displayText: "New Datasource",
    action: () =>
      executeCommand({
        actionType: SlashCommand.NEW_INTEGRATION,
        args: {},
      }),
    shortcut: Shortcuts.PLUS,
  });
  const suggestions = entitiesForSuggestions.map((suggestion: any) => {
    const name = suggestion.name || suggestion.widgetName;
    return {
      text:
        suggestion.ENTITY_TYPE === ENTITY_TYPE.ACTION
          ? `{{${name}.data}}`
          : suggestion.ENTITY_TYPE === ENTITY_TYPE.JSACTION
          ? `{{${name}.}}`
          : `{{${name}}}`,
      displayText: `${name}`,
      className: "CodeMirror-commands",
      data: suggestion,
      triggerCompletionsPostPick: suggestion.ENTITY_TYPE !== ENTITY_TYPE.ACTION,
      render: (element: HTMLElement, self: any, data: any) => {
        const pluginType = data.data.pluginType as PluginType;
        let icon = null;
        if (pluginType === PluginType.JS) {
          icon = JsFileIconV2();
        } else if (pluginIdToImageLocation[data.data.pluginId]) {
          icon = (
            <EntityIcon>
              <img
                src={getAssetUrl(pluginIdToImageLocation[data.data.pluginId])}
              />
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
  const datasourceCommands = datasources.map((action: any) => {
    return {
      text: "",
      displayText: `${action.name}`,
      className: "CodeMirror-commands",
      data: action,
      action: () =>
        executeCommand({
          actionType: SlashCommand.NEW_QUERY,
          args: { datasource: action },
        }),
      render: (element: HTMLElement, self: any, data: any) => {
        const icon = (
          <EntityIcon>
            <img
              src={getAssetUrl(pluginIdToImageLocation[data.data.pluginId])}
            />
          </EntityIcon>
        );
        ReactDOM.render(
          <Command icon={icon} name={`New ${data.displayText} query`} />,
          element,
        );
      },
    };
  });
  const suggestionsMatchingSearchText = matchingCommands(
    suggestions,
    searchText,
    recentEntities,
    5,
  );
  const actionCommands = [newBinding, insertSnippet];

  // Adding this hack in the interest of time.
  // TODO: Refactor slash commands generation for easier code splitting
  if (
    addAISlashCommand &&
    featureFlags.CHAT_AI &&
    currentEntityType !== ENTITY_TYPE.ACTION
  ) {
    const askGPT: CommandsCompletion = generateCreateNewCommand({
      text: "",
      displayText: "Ask AI",
      shortcut: Shortcuts.ASK_AI,
      action: () =>
        executeCommand({
          actionType: SlashCommand.ASK_AI,
          args: {
            entityType: currentEntityType,
            expectedType: expectedType,
            entityId: entityId,
            propertyPath: propertyPath,
          },
        }),
    });
    actionCommands.push(askGPT);
  }

  suggestionsMatchingSearchText.push(
    ...matchingCommands(actionCommands, searchText, []),
  );
  let createNewCommands: any = [];
  if (currentEntityType === ENTITY_TYPE.WIDGET) {
    createNewCommands = [...datasourceCommands];
  }
  const createNewCommandsMatchingSearchText = matchingCommands(
    createNewCommands,
    searchText,
    [],
    3,
  );
  if (currentEntityType === ENTITY_TYPE.WIDGET) {
    createNewCommandsMatchingSearchText.push(
      ...matchingCommands([newIntegration], searchText, []),
    );
  }
  let list: CommandsCompletion[] = [];
  if (suggestionsMatchingSearchText.length) {
    list = [suggestionsHeader, ...suggestionsMatchingSearchText];
  }

  if (createNewCommandsMatchingSearchText.length) {
    list = [...list, createNewHeader, ...createNewCommandsMatchingSearchText];
  }
  return list;
};
