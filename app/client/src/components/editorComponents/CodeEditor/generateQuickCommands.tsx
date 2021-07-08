import { Datasource } from "entities/Datasource";
import React from "react";
import { CommandsCompletion } from "utils/autocomplete/TernServer";
import ReactDOM from "react-dom";
import sortBy from "lodash/sortBy";
import { PluginType } from "entities/Action";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api-colored.svg";
import { ReactComponent as DataSourcesColoredIcon } from "assets/icons/menu/datasource-colored.svg";

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
  const newBinding: CommandsCompletion = generateCreateNewCommand({
    text: "{{}}",
    displayText: "New Binding",
    shortcut: "{{}}",
  });
  const newDatasource: CommandsCompletion = generateCreateNewCommand({
    text: "",
    displayText: "New Datasource",
    action: () =>
      executeCommand({
        actionType: "NEW_DATASOURCE",
      }),
    shortcut: "datasource.new",
  });
  const suggestions = entitiesForSuggestions.map((suggestion: any) => {
    const name = suggestion.name || suggestion.widgetName;
    return {
      text: currentEntityType === "WIDGET" ? `{{${name}.data}}` : `{{${name}}}`,
      displayText: `${name}`,
      className: "CodeMirror-commands",
      shortcut: "{{}}",
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
      shortcut: `${action.name}.new`,
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
    currentEntityType === "WIDGET" ? 2 : 3,
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
  console.log({ currentEntityType });
  if (currentEntityType === "WIDGET") {
    createNewCommandsMatchingSearchText.push(
      ...matchingCommands([newDatasource], searchText, []),
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
  limit = 2,
) => {
  list = list.filter((action: any) => {
    return (
      action.displayText.toLowerCase().startsWith(searchText.toLowerCase()) ||
      action.shortcut.toLowerCase().startsWith(searchText.toLowerCase())
    );
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
  type: "UNKNOWN",
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
  type: "UNKNOWN",
  className: "CodeMirror-commands",
  shortcut: shortcut,
  action: action,
  render: (element: HTMLElement, self: any, data: any) => {
    ReactDOM.render(
      <Command name={data.displayText} shortcut={data.shortcut} />,
      element,
    );
  },
});

function Command(props: {
  pluginType?: PluginType;
  imgSrc?: string;
  name: string;
  shortcut: string;
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
        <span>{props.name}</span>
      </div>
      <span className="shortcut">{props.shortcut}</span>
    </div>
  );
}
