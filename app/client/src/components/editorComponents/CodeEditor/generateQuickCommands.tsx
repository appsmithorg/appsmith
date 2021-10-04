import { Datasource } from "entities/Datasource";
import React from "react";
import {
  AutocompleteDataType,
  CommandsCompletion,
} from "utils/autocomplete/TernServer";
import ReactDOM from "react-dom";
import sortBy from "lodash/sortBy";
import { PluginType, SlashCommand, SlashCommandPayload } from "entities/Action";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api-colored.svg";
import { ReactComponent as JsIcon } from "assets/icons/menu/js-group.svg";
import { ReactComponent as DataSourcesColoredIcon } from "assets/icons/menu/datasource-colored.svg";
import { ReactComponent as NewPlus } from "assets/icons/menu/new-plus.svg";
import { ReactComponent as Binding } from "assets/icons/menu/binding.svg";
import { ReactComponent as Snippet } from "assets/icons/ads/snippet.svg";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

enum Shortcuts {
  PLUS = "PLUS",
  BINDING = "BINDING",
  FUNCTION = "FUNCTION",
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
}: any): CommandsCompletion => ({
  text: text,
  displayText: displayText,
  data: { doc: "" },
  origin: "",
  type: AutocompleteDataType.UNKNOWN,
  className: "CodeMirror-commands",
  shortcut: shortcut,
  action: action,
  render: (element: HTMLElement, self: any, data: any) => {
    ReactDOM.render(
      <Command
        customText={data.customText}
        name={data.displayText}
        shortcut={data.shortcut}
      />,
      element,
    );
  },
});

const iconsByType = {
  [Shortcuts.BINDING]: <Binding />,
  [Shortcuts.PLUS]: <NewPlus />,
  [Shortcuts.FUNCTION]: <Snippet className="snippet-icon" />,
};

function Command(props: {
  pluginType?: PluginType;
  imgSrc?: string;
  name: string;
  shortcut: Shortcuts;
  customText?: string;
}) {
  return (
    <div className="command-container">
      <div className="command">
        {props.pluginType &&
          {
            DB: <DataSourcesColoredIcon />,
            API: <ApisIcon />,
            SAAS: <DataSourcesColoredIcon />,
            REMOTE: <DataSourcesColoredIcon />,
            JS: <JsIcon />,
          }[props.pluginType]}
        {props.imgSrc && <img src={props.imgSrc} />}
        {props.shortcut && iconsByType[props.shortcut]}
        <span>{props.name}</span>
      </div>
    </div>
  );
}

export const generateQuickCommands = (
  entitiesForSuggestions: any[],
  currentEntityType: string,
  searchText: string,
  {
    datasources,
    executeCommand,
    pluginIdToImageLocation,
    recentEntities,
  }: {
    datasources: Datasource[];
    executeCommand: (payload: SlashCommandPayload) => void;
    pluginIdToImageLocation: Record<string, string>;
    recentEntities: string[];
  },
  expectedType: string,
  entityId: any,
  propertyPath: any,
) => {
  const suggestionsHeader: CommandsCompletion = commandsHeader("Bind Data");
  const createNewHeader: CommandsCompletion = commandsHeader("Create New");
  recentEntities.reverse();
  const newBinding: CommandsCompletion = generateCreateNewCommand({
    text: "{{}}",
    displayText: "New Binding",
    shortcut: Shortcuts.BINDING,
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
      render: (element: HTMLElement, self: any, data: any) => {
        const pluginType = data.data.pluginType as PluginType;
        ReactDOM.render(
          <Command
            name={data.displayText}
            pluginType={pluginType}
            shortcut={data.shortcut}
          />,
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
        ReactDOM.render(
          <Command
            imgSrc={pluginIdToImageLocation[data.data.pluginId]}
            name={data.displayText}
            shortcut={data.shortcut}
          />,
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
