import type { Datasource } from "entities/Datasource";
import type { MouseEventHandler } from "react";
import React, { useCallback } from "react";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import ReactDOM from "react-dom";
import type { SlashCommandPayload } from "entities/Action";
import { PluginType, SlashCommand } from "entities/Action";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { Button, Icon } from "@appsmith/ads";
import { APPSMITH_AI } from "ee/components/editorComponents/GPT/trigger";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import BetaCard from "../BetaCard";
import type { NavigationData } from "selectors/navigationSelectors";
import type { AIEditorContext } from "ee/components/editorComponents/GPT";
import type { EntityTypeValue } from "ee/entities/DataTree/types";
import history, { NavigationMethod } from "utils/history";
import type { Plugin } from "api/PluginApi";
import { EDIT, createMessage } from "ee/constants/messages";
import { getShowHintOptions } from "./commandsHelper";

export enum Shortcuts {
  PLUS = "PLUS",
  BINDING = "BINDING",
  FUNCTION = "FUNCTION",
  ASK_AI = "ASK_AI",
  SHOW_MORE = "SHOW_MORE",
}

const filteredCommands: CommandsCompletion[] = [];
const NO_OF_QUERIES_TO_SHOW_BY_DEFAULT = 5;

export const getShowMoreLabel = (suggestions: CommandsCompletion[]) => {
  return (
    "Load " + (suggestions.length - NO_OF_QUERIES_TO_SHOW_BY_DEFAULT) + " more"
  );
};

export function matchingCommands(
  list: CommandsCompletion[],
  searchText: string,
) {
  return list.filter((action) => {
    return (
      action.displayText &&
      action.displayText.toLowerCase().indexOf(searchText.toLowerCase()) > -1
    );
  });
}

export const showMoreCommandOption = (
  displayText: string,
  editor: CodeMirror.Editor,
  focusEditor: (focusOnLine?: number, chOffset?: number) => void,
  suggestions: CommandsCompletion[],
  searchText: string = "",
): CommandsCompletion => ({
  text: "",
  displayText: displayText,
  className: "CodeMirror-commands show-more-option",
  data: {},
  shortcut: Shortcuts.SHOW_MORE,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (element: HTMLElement, self: any, data: any) => {
    ReactDOM.render(
      <ShowMoreCommand
        editor={editor}
        focusEditor={focusEditor}
        icon={iconsByType[data.shortcut as Shortcuts]}
        name={data.displayText}
        searchText={searchText}
        suggestions={suggestions}
      />,
      element,
    );
  },
});

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
  triggerCompletionsPostPick, // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any): CommandsCompletion => ({
  text,
  displayText: displayText,
  data: {},
  className: "CodeMirror-commands",
  shortcut,
  action,
  triggerCompletionsPostPick,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  [Shortcuts.SHOW_MORE]: (
    <Icon className="show-more-icon" name="more-horizontal-control" size="md" />
  ),
};

export function ShowMoreCommand(props: {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  name: string;
  editor: CodeMirror.Editor;
  focusEditor: (focusOnLine?: number, chOffset?: number) => void;
  suggestions: CommandsCompletion[];
  searchText: string;
}) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleShowMoreClick = (event: any) => {
    event.stopPropagation();
    event.preventDefault();

    const suggestionsMatchingSearchText = matchingCommands(
      props.suggestions,
      props.searchText,
    );
    const showMoreLabel = getShowMoreLabel(suggestionsMatchingSearchText);
    const loadMoreOptionIndex = filteredCommands.findIndex(
      (element) => element.displayText === showMoreLabel,
    );
    if (loadMoreOptionIndex !== -1) {
      const suggestionList = matchingCommands(
        props.suggestions.slice(
          NO_OF_QUERIES_TO_SHOW_BY_DEFAULT,
          props.suggestions.length,
        ),
        props.searchText,
      ).slice(0, props.suggestions.length);
      filteredCommands.splice(loadMoreOptionIndex, 1, ...suggestionList);
    }

    // Modify the list
    props.editor.showHint(
      getShowHintOptions(
        filteredCommands,
        props.editor,
        props.focusEditor,
        props.searchText,
      ),
    );
  };
  return (
    <div
      className="command-container relative cursor-pointer w-full"
      onClick={(e) => {
        handleShowMoreClick(e);
      }}
    >
      <div className="command flex w-full">
        <div className="self-center shrink-0">{props.icon}</div>
        <div className="flex grow">
          <div className="flex flex-col gap-1 grow w-full">
            <div className="whitespace-nowrap flex flex-row items-center gap-2 text-[color:var(--ads-v2\-colors-content-label-default-fg)] relative">
              <span className="flex items-center overflow-hidden overflow-ellipsis slash-command-hint-text">
                {props.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Command(props: {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  name: string;
  desc?: string;
  isBeta?: boolean;
  url?: string;
  eventParams?: Record<string, string | boolean>;
}) {
  const switchToAction: MouseEventHandler<HTMLElement> = useCallback(
    (event) => {
      event.stopPropagation();
      if (!props.url) return;

      history.push(props.url, { invokedBy: NavigationMethod.SlashCommandHint });
      AnalyticsUtil.logEvent("EDIT_ACTION_CLICK", props.eventParams || {});
    },
    [props.url, props.eventParams],
  );

  return (
    <div className="command-container relative cursor-pointer w-full">
      <div className="command flex w-full">
        <div className="self-center shrink-0">{props.icon}</div>
        <div className="flex grow">
          <div className="flex flex-col gap-1 grow w-full">
            <div className="whitespace-nowrap flex flex-row items-center gap-2 text-[color:var(--ads-v2\-colors-content-label-default-fg)] relative">
              <span className="flex items-center overflow-hidden overflow-ellipsis slash-command-hint-text">
                {props.name}
              </span>
              {props.isBeta && <BetaCard />}
            </div>
            {props.desc ? (
              <div className="command-desc">{props.desc}</div>
            ) : null}
          </div>
          {props.url ? (
            <Button
              className="hidden group-hover:flex items-center self-center h-full px-2 text-xs !absolute command-suggestion-edit right-0 top-0"
              kind="tertiary"
              onClick={switchToAction}
              size="sm"
            >
              {createMessage(EDIT)}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const generateQuickCommands = (
  entitiesForSuggestions: NavigationData[],
  currentEntityType: EntityTypeValue,
  searchText: string,
  {
    aiContext,
    datasources,
    enableAIAssistance,
    executeCommand,
    pluginIdToPlugin,
  }: {
    aiContext: AIEditorContext;
    datasources: Datasource[];
    executeCommand: (payload: SlashCommandPayload) => void;
    pluginIdToPlugin: Record<string, Plugin>;
    recentEntities: string[];
    featureFlags: FeatureFlags;
    enableAIAssistance: boolean;
  },
  editor: CodeMirror.Editor,
  focusEditor: (focusOnLine?: number, chOffset?: number) => void,
) => {
  filteredCommands.splice(0, filteredCommands.length);
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
        suggestion.type === ENTITY_TYPE.ACTION
          ? `{{${name}.data}}`
          : suggestion.type === ENTITY_TYPE.JSACTION
            ? `{{${name}.}}`
            : `{{${name}}}`,
      displayText: `${name}`,
      className: "CodeMirror-commands group relative Codemirror-commands-apis",
      data: suggestion,
      triggerCompletionsPostPick: suggestion.type !== ENTITY_TYPE.ACTION,
      render: (element: HTMLElement, _: unknown, data: CommandsCompletion) => {
        let icon = null;
        const completionData = data.data as NavigationData;
        const plugin = pluginIdToPlugin[completionData.pluginId || ""];
        if (completionData.type === ENTITY_TYPE.JSACTION) {
          icon = JsFileIconV2(16, 16);
        } else if (plugin?.iconLocation) {
          icon = (
            <EntityIcon height="16px" width="16px">
              <img src={getAssetUrl(plugin.iconLocation)} />
            </EntityIcon>
          );
        }
        ReactDOM.render(
          <Command
            eventParams={{
              actionId: suggestion.id,
              datasourceId: suggestion.datasourceId || "",
              pluginName: suggestion.pluginName || "",
              actionType: plugin?.type === PluginType.DB ? "Query" : "API",
              isMock: !!suggestion?.isMock,
              from: NavigationMethod.SlashCommandHint,
            }}
            icon={icon}
            name={data.displayText as string}
            url={suggestion.url}
          />,
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (element: HTMLElement, self: any, data: CommandsCompletion) => {
        const completionData = data.data as Datasource;
        const icon = (
          <EntityIcon height="16px" width="16px">
            <img
              src={getAssetUrl(
                pluginIdToPlugin[completionData.pluginId].iconLocation,
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

  if (currentEntityType !== ENTITY_TYPE.JSACTION) {
    // New binding command is not applicable in JS Objects
    commonCommands.push(newBinding);
  }

  // Filter common commands based on search text
  const commonCommandsMatchingSearchText = matchingCommands(
    commonCommands,
    searchText,
  ).slice(0, NO_OF_QUERIES_TO_SHOW_BY_DEFAULT);

  filteredCommands.push(...commonCommandsMatchingSearchText);

  if (currentEntityType !== ENTITY_TYPE.JSACTION) {
    // Binding suggestions and create query commands are not applicable in JS Objects

    // Get top 5 matching suggestions
    const suggestionsMatchingSearchText = matchingCommands(
      suggestions,
      searchText,
    );

    const limitedSuggestions = suggestionsMatchingSearchText.slice(
      0,
      NO_OF_QUERIES_TO_SHOW_BY_DEFAULT,
    );

    const loadMoreCommand = showMoreCommandOption(
      getShowMoreLabel(suggestionsMatchingSearchText),
      editor,
      focusEditor,
      suggestions,
      searchText,
    );

    if (suggestionsMatchingSearchText.length) {
      // Add header only if there are suggestions
      filteredCommands.push(
        commandsHeader("Bind data", "", filteredCommands.length > 0),
      );
      filteredCommands.push(...limitedSuggestions);
      if (
        suggestionsMatchingSearchText.length > NO_OF_QUERIES_TO_SHOW_BY_DEFAULT
      ) {
        filteredCommands.push(loadMoreCommand);
      }
    }

    if (currentEntityType === ENTITY_TYPE.WIDGET) {
      const createNewCommands: CommandsCompletion[] = [];
      createNewCommands.push(...datasourceCommands);

      // Get top 3 matching create new commands
      const createNewCommandsMatchingSearchText = matchingCommands(
        createNewCommands,
        searchText,
      ).slice(0, 3);

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
