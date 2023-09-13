import type { Datasource } from "entities/Datasource";
import React from "react";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import ReactDOM from "react-dom";
import sortBy from "lodash/sortBy";
import type { SlashCommandPayload } from "entities/Action";
import { PluginType, SlashCommand } from "entities/Action";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { Icon } from "design-system";
import { APPSMITH_AI } from "@appsmith/components/editorComponents/GPT/trigger";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import AnalyticsUtil from "utils/AnalyticsUtil";
import BetaCard from "../BetaCard";

export enum Shortcuts {
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

export const commandsHeader = (
  displayText: string,
  text = "",
  separator = true,
): CommandsCompletion => ({
  text: text,
  displayText: displayText,
  className: `CodeMirror-command-header ${separator ? "separator" : ""}`,
  data: { doc: "" },
  origin: "",
  type: AutocompleteDataType.UNKNOWN,
  isHeader: true,
  shortcut: "",
});

export const generateCreateNewCommand = ({
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

export const iconsByType = {
  [Shortcuts.BINDING]: <Icon name="binding-new" size="md" />,
  [Shortcuts.PLUS]: (
    <Icon className="add-datasource-icon" name="add-box-line" size="md" />
  ),
  [Shortcuts.FUNCTION]: (
    <Icon className="snippet-icon" name="snippet" size="md" />
  ),
  [Shortcuts.ASK_AI]: <Icon className="magic" name="magic-line" size="md" />,
};

export function Command(props: {
  icon: any;
  name: string;
  desc?: string;
  isBeta?: boolean;
}) {
  return (
    <div className="command-container">
      <div className="command">
        {props.icon}
        <div className="flex flex-col gap-1">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap flex flex-row items-center gap-2 text-[color:var(--ads-v2\-colors-content-label-default-fg)]">
            {props.name}
            {props.isBeta && <BetaCard />}
          </div>
          {props.desc ? <div className="command-desc">{props.desc}</div> : null}
        </div>
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
    enableAIAssistance,
    executeCommand,
    pluginIdToImageLocation,
    recentEntities,
  }: {
    datasources: Datasource[];
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
    displayText: "New binding",
    shortcut: Shortcuts.BINDING,
    triggerCompletionsPostPick: true,
  });
  const newIntegration: CommandsCompletion = generateCreateNewCommand({
    text: "",
    displayText: "New datasource",
    action: () => {
      executeCommand({
        actionType: SlashCommand.NEW_INTEGRATION,
        args: {},
      });
      // Event for datasource creation click
      const entryPoint = DatasourceCreateEntryPoints.CODE_EDITOR_SLASH_COMMAND;
      AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
        entryPoint,
      });
    },
    shortcut: Shortcuts.PLUS,
  });
  const suggestions = entitiesForSuggestions.map((suggestion: any) => {
    const name = suggestion.entityName;
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
          icon = JsFileIconV2(16, 16);
        } else if (pluginIdToImageLocation[data.data.pluginId]) {
          icon = (
            <EntityIcon height="16px" width="16px">
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
          <EntityIcon height="16px" width="16px">
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
  const actionCommands = [newBinding];

  if (enableAIAssistance) {
    const askGPT: CommandsCompletion = generateCreateNewCommand({
      text: "",
      displayText: APPSMITH_AI,
      shortcut: Shortcuts.ASK_AI,
      triggerCompletionsPostPick: true,
      description: "Generate code using AI",
      isBeta: true,
    });
    actionCommands.unshift(askGPT);
  }
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
  const actionCommandsMatchingSearchText = matchingCommands(
    actionCommands,
    searchText,
    [],
  );
  if (currentEntityType === ENTITY_TYPE.WIDGET) {
    createNewCommandsMatchingSearchText.push(
      ...matchingCommands([newIntegration], searchText, []),
    );
  }
  const list: CommandsCompletion[] = actionCommandsMatchingSearchText;
  if (suggestionsMatchingSearchText.length) {
    list.push(commandsHeader("Bind data", "", list.length > 0));
  }
  list.push(...suggestionsMatchingSearchText);
  if (createNewCommandsMatchingSearchText.length) {
    list.push(commandsHeader("Create a query", "", list.length > 0));
  }
  list.push(...createNewCommandsMatchingSearchText);
  return list;
};
