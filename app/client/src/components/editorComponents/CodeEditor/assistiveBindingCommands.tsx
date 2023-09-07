import type { Datasource } from "entities/Datasource";
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
import type { EntityNavigationData } from "selectors/navigationSelectors";

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
  [Shortcuts.BINDING]: <Icon name="binding" size="md" />,
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
    datasources,
    entitiesForNavigation,
    pluginIdToImageLocation,
    recentEntities,
  }: {
    datasources: Datasource[];
    executeCommand: (payload: SlashCommandPayload) => void;
    pluginIdToImageLocation: Record<string, string>;
    recentEntities: string[];
    featureFlags: FeatureFlags;
    enableAIAssistance: boolean;
    entitiesForNavigation?: EntityNavigationData;
  },
) => {
  const suggestionsHeader: CommandsCompletion = commandsHeader("Bind data");
  recentEntities.reverse();
  const newBinding: CommandsCompletion = generateCreateNewCommand({
    text: "{{}", // the last } already added by the codemirror autocomplete
    displayText: "New binding",
    shortcut: Shortcuts.BINDING,
    triggerCompletionsPostPick: true,
  });

  const actionEntities = entitiesForSuggestions.filter((suggestion: any) => {
    return suggestion.ENTITY_TYPE === ENTITY_TYPE.ACTION;
  });
  const suggestionsAction = actionEntities.map((suggestion: any) => {
    const name = suggestion.entityName;
    return {
      text: `{{${name}.data}}`,
      displayText: `${name}`,
      className: "CodeMirror-commands",
      data: suggestion,
      triggerCompletionsPostPick: suggestion.ENTITY_TYPE !== ENTITY_TYPE.ACTION,
      render: (element: HTMLElement, self: any, data: any) => {
        const name = data.data.entityName;
        const datasourceId = entitiesForNavigation?.[name].datasourceId;
        const datasource = datasources.find(
          (datasource) => datasource.id === datasourceId,
        );
        const pluginId = datasource?.pluginId;
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
    return suggestion.ENTITY_TYPE === ENTITY_TYPE.JSACTION;
  });
  const suggestionsJSAction = jsActionEntities.flatMap((suggestion: any) => {
    const name = suggestion.entityName;
    const keys = Object.keys(suggestion);
    return keys.map((key: string) => {
      return {
        text: `{{${name}.${key}}}`,
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

  const createNewCommands: any = [];

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

  const list: CommandsCompletion[] = actionCommandsMatchingSearchText;

  if (suggestionsMatchingSearchText.length) {
    list.push(suggestionsHeader);
  }
  list.push(...suggestionsMatchingSearchText);

  list.push(...createNewCommandsMatchingSearchText);
  return list;
};
