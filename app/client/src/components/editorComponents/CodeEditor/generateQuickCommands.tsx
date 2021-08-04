import { Datasource } from "entities/Datasource";
import React from "react";
import {
  AutocompleteDataType,
  CommandsCompletion,
} from "utils/autocomplete/TernServer";
import ReactDOM from "react-dom";
import sortBy from "lodash/sortBy";
import { PluginType } from "entities/Action";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api-colored.svg";
import { ReactComponent as DataSourcesColoredIcon } from "assets/icons/menu/datasource-colored.svg";
import { ReactComponent as NewPlus } from "assets/icons/menu/new-plus.svg";
import { ReactComponent as Binding } from "assets/icons/menu/binding.svg";

enum Shortcuts {
  PLUS = "PLUS",
  BINDING = "BINDING",
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
    executeCommand: (payload: { actionType: string; args?: any }) => void;
    pluginIdToImageLocation: Record<string, string>;
    recentEntities: string[];
  },
) => {
  const suggestionsHeader: CommandsCompletion = commandsHeader("Bind Data");
  const createNewHeader: CommandsCompletion = commandsHeader("Create New");
  recentEntities.reverse();
  const newBinding: CommandsCompletion = generateCreateNewCommand({
    text: "{{}}",
    displayText: "New Binding",
    shortcut: Shortcuts.BINDING,
  });
  const newIntegration: CommandsCompletion = generateCreateNewCommand({
    text: "",
    displayText: "New Datasource",
    action: () =>
      executeCommand({
        actionType: "NEW_INTEGRATION",
      }),
    shortcut: Shortcuts.PLUS,
  });
  const suggestions = entitiesForSuggestions.map((suggestion: any) => {
    const name = suggestion.name || suggestion.widgetName;
    return {
      text: currentEntityType === "WIDGET" ? `{{${name}.data}}` : `{{${name}}}`,
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
          actionType: "NEW_QUERY",
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
  suggestionsMatchingSearchText.push(
    ...matchingCommands([newBinding], searchText, []),
  );
  let createNewCommands: any = [];
  if (currentEntityType === "WIDGET") {
    createNewCommands = [...datasourceCommands];
  }
  const createNewCommandsMatchingSearchText = matchingCommands(
    createNewCommands,
    searchText,
    [],
    3,
  );
  if (currentEntityType === "WIDGET") {
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
      (a.data.ENTITY_TYPE === "WIDGET"
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
          }[props.pluginType]}
        {props.imgSrc && <img src={props.imgSrc} />}
        {props.shortcut &&
          { [Shortcuts.BINDING]: <Binding />, [Shortcuts.PLUS]: <NewPlus /> }[
            props.shortcut
          ]}
        <span>{props.name}</span>
      </div>
    </div>
  );
}
