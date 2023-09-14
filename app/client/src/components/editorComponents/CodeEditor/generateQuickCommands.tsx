import type { Datasource } from "entities/Datasource";
import React from "react";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import ReactDOM from "react-dom";
import type { SlashCommandPayload } from "entities/Action";
import { SlashCommand } from "entities/Action";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { Icon } from "design-system";
import { APPSMITH_AI } from "@appsmith/components/editorComponents/GPT/trigger";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import AnalyticsUtil from "utils/AnalyticsUtil";
import BetaCard from "../BetaCard";
import type { NavigationData } from "selectors/navigationSelectors";

export enum Shortcuts {
  PLUS = "PLUS",
  BINDING = "BINDING",
  FUNCTION = "FUNCTION",
  ASK_AI = "ASK_AI",
}

export function matchingCommands(
  list: CommandsCompletion[],
  searchText: string,
  limit = 5,
) {
  return list
    .filter((action) => {
      return (
        action.displayText &&
        action.displayText.toLowerCase().indexOf(searchText.toLowerCase()) > -1
      );
    })
    .slice(0, limit);
}

export const commandsHeader = (
  displayText: string,
  text = "",
  separator = true,
): CommandsCompletion => ({
  text: text,
  displayText: displayText,
  className: `CodeMirror-command-header ${separator ? "separator" : ""}`,
  data: {},
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
  data: {},
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
  entitiesForSuggestions: NavigationData[],
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
  const suggestions = entitiesForSuggestions.map((suggestion) => {
    const name = suggestion.name;
    return {
      text:
        suggestion.type === ENTITY_TYPE.ACTION
          ? `{{${name}.data}}`
          : suggestion.type === ENTITY_TYPE.JSACTION
          ? `{{${name}.}}`
          : `{{${name}}}`,
      displayText: `${name}`,
      className: "CodeMirror-commands",
      data: suggestion,
      triggerCompletionsPostPick: suggestion.type !== ENTITY_TYPE.ACTION,
      render: (element: HTMLElement, _: unknown, data: CommandsCompletion) => {
        let icon = null;
        const completionData = data.data as NavigationData;
        if (completionData.type === ENTITY_TYPE.JSACTION) {
          icon = JsFileIconV2(16, 16);
        } else if (
          completionData.pluginId &&
          pluginIdToImageLocation[completionData.pluginId]
        ) {
          icon = (
            <EntityIcon height="16px" width="16px">
              <img
                src={getAssetUrl(
                  pluginIdToImageLocation[completionData.pluginId],
                )}
              />
            </EntityIcon>
          );
        }
        ReactDOM.render(
          <Command icon={icon} name={data.displayText as string} />,
          element,
        );
      },
    };
  });
  const datasourceCommands = datasources.map((action) => {
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
      render: (element: HTMLElement, self: any, data: CommandsCompletion) => {
        const completionData = data.data as Datasource;
        const icon = (
          <EntityIcon height="16px" width="16px">
            <img
              src={getAssetUrl(
                pluginIdToImageLocation[completionData.pluginId],
              )}
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
  const createNewCommands: CommandsCompletion[] = [];

  if (currentEntityType === ENTITY_TYPE.WIDGET)
    createNewCommands.push(...datasourceCommands);

  const createNewCommandsMatchingSearchText = matchingCommands(
    createNewCommands,
    searchText,
    3,
  );
  const actionCommandsMatchingSearchText = matchingCommands(
    actionCommands,
    searchText,
  );
  if (currentEntityType === ENTITY_TYPE.WIDGET) {
    createNewCommandsMatchingSearchText.push(
      ...matchingCommands([newIntegration], searchText),
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
