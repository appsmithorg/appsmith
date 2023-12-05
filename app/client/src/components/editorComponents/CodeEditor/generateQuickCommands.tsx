import type { Datasource } from "entities/Datasource";
import React from "react";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import ReactDOM from "react-dom";
import type { SlashCommandPayload } from "entities/Action";
import { SlashCommand } from "entities/Action";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { Icon } from "design-system";
import { APPSMITH_AI } from "@appsmith/components/editorComponents/GPT/trigger";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import AnalyticsUtil from "utils/AnalyticsUtil";
import BetaCard from "../BetaCard";
import type { NavigationData } from "selectors/navigationSelectors";
import type { AIEditorContext } from "@appsmith/components/editorComponents/GPT";
import type { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";

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
      <div className="command flex">
        <div className="self-center">{props.icon}</div>
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
    aiContext,
    datasources,
    enableAIAssistance,
    executeCommand,
    pluginIdToImageLocation,
  }: {
    aiContext: AIEditorContext;
    datasources: Datasource[];
    executeCommand: (payload: SlashCommandPayload) => void;
    pluginIdToImageLocation: Record<string, string>;
    recentEntities: string[];
    featureFlags: FeatureFlags;
    enableAIAssistance: boolean;
  },
) => {
  const newBinding: CommandsCompletion = generateCreateNewCommand({
    text: "{{}}",
    displayText: "Add a binding",
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
        suggestion.type === ENTITY_TYPE_VALUE.ACTION
          ? `{{${name}.data}}`
          : suggestion.type === ENTITY_TYPE_VALUE.JSACTION
          ? `{{${name}.}}`
          : `{{${name}}}`,
      displayText: `${name}`,
      className: "CodeMirror-commands",
      data: suggestion,
      triggerCompletionsPostPick: suggestion.type !== ENTITY_TYPE_VALUE.ACTION,
      render: (element: HTMLElement, _: unknown, data: CommandsCompletion) => {
        let icon = null;
        const completionData = data.data as NavigationData;
        if (completionData.type === ENTITY_TYPE_VALUE.JSACTION) {
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
      action: (callback?: (completion: string) => void) =>
        executeCommand({
          actionType: SlashCommand.NEW_QUERY,
          args: { datasource: action },
          callback,
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

  const filteredCommands: CommandsCompletion[] = [];
  const commonCommands: CommandsCompletion[] = [];

  if (enableAIAssistance) {
    const askGPT: CommandsCompletion = generateCreateNewCommand({
      text: "",
      displayText: APPSMITH_AI,
      shortcut: Shortcuts.ASK_AI,
      triggerCompletionsPostPick: true,
      isBeta: true,
      action: () => {
        executeCommand({
          actionType: SlashCommand.ASK_AI,
          args: aiContext,
        });
      },
    });
    commonCommands.unshift(askGPT);
  }

  if (currentEntityType !== ENTITY_TYPE_VALUE.JSACTION) {
    // New binding command is not applicable in JS Objects
    commonCommands.push(newBinding);
  }

  // Filter common commands based on search text
  const commonCommandsMatchingSearchText = matchingCommands(
    commonCommands,
    searchText,
  );

  filteredCommands.push(...commonCommandsMatchingSearchText);

  if (currentEntityType !== ENTITY_TYPE_VALUE.JSACTION) {
    // Binding suggestions and create query commands are not applicable in JS Objects

    // Get top 5 matching suggestions
    const suggestionsMatchingSearchText = matchingCommands(
      suggestions,
      searchText,
      5,
    );

    if (suggestionsMatchingSearchText.length) {
      // Add header only if there are suggestions
      filteredCommands.push(
        commandsHeader("Bind data", "", filteredCommands.length > 0),
      );
      filteredCommands.push(...suggestionsMatchingSearchText);
    }

    if (currentEntityType === ENTITY_TYPE_VALUE.WIDGET) {
      const createNewCommands: CommandsCompletion[] = [];
      createNewCommands.push(...datasourceCommands);

      // Get top 3 matching create new commands
      const createNewCommandsMatchingSearchText = matchingCommands(
        createNewCommands,
        searchText,
        3,
      );

      // Check if new integration command matches search text
      createNewCommandsMatchingSearchText.push(
        ...matchingCommands([newIntegration], searchText),
      );

      if (createNewCommandsMatchingSearchText.length) {
        // Add header only if there are create new commands
        filteredCommands.push(
          commandsHeader("Create a query", "", filteredCommands.length > 0),
        );
        filteredCommands.push(...createNewCommandsMatchingSearchText);
      }
    }
  }

  return filteredCommands;
};
