import React from "react";
import ReactDOM from "react-dom";
import CodeMirror from "codemirror";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { CommandsCompletion } from "utils/autocomplete/TernServer";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api-colored.svg";
import { ReactComponent as DataSourcesColoredIcon } from "assets/icons/menu/datasource-colored.svg";
import { PluginType } from "entities/Action";
import sortBy from "lodash/sortBy";
import { checkIfCursorInsideBinding } from "./hintHelpers";

export const commandsHelper: HintHelper = (editor, data: any) => {
  let entitiesForSuggestions = Object.values(data).filter(
    (entity: any) => entity.ENTITY_TYPE && entity.ENTITY_TYPE !== "APPSMITH",
  );
  return {
    showHint: (
      editor: CodeMirror.Editor,
      _: string,
      entityName: string,
      {
        datasources,
        executeCommand,
        pluginIdToImageLocation,
        recentEntities,
        updatePropertyValue,
      },
    ) => {
      const currentEntityType = data[entityName]?.ENTITY_TYPE || "ACTION";
      entitiesForSuggestions = entitiesForSuggestions.filter((entity: any) => {
        return currentEntityType === "WIDGET"
          ? entity.ENTITY_TYPE !== "WIDGET"
          : entity.ENTITY_TYPE !== "ACTION";
      });
      const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const value = editor.getValue();
      const slashIndex = value.lastIndexOf("/");
      if (!cursorBetweenBinding && slashIndex > -1) {
        const suggestionsHeader: CommandsCompletion = commandsHeader(
          "Bind Data",
        );
        const createNewHeader: CommandsCompletion = commandsHeader(
          "Create New",
        );
        const newBinding: CommandsCompletion = generateCreateNewCommand({
          text: "{{}}",
          displayText: "New Binding",
          shortcut: "{{}}",
        });
        const newIntegration: CommandsCompletion = generateCreateNewCommand({
          text: "",
          displayText: "New Integration",
          action: () =>
            executeCommand({
              actionType: "NEW_INTEGRATION",
            }),
          shortcut: "integration.new",
        });
        let currentSelection: CommandsCompletion = {
          origin: "",
          type: "UNKNOWN",
          data: {
            doc: "",
          },
          text: "",
          shortcut: "",
        };
        const searchText = value.substring(slashIndex + 1);
        const suggestions = entitiesForSuggestions.map((suggestion: any) => {
          const name = suggestion.name || suggestion.widgetName;
          return {
            text:
              currentEntityType === "WIDGET"
                ? `{{${name}.data}}`
                : `{{${name}}}`,
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
        let createNewCommands: any = [];
        if (currentEntityType === "WIDGET") {
          createNewCommands = [...datasourceCommands]; //[newAPI, newDatasource];
        }
        const createNewCommandsMatchingSearchText = matchingCommands(
          createNewCommands,
          searchText,
          [],
          3,
        );
        createNewCommandsMatchingSearchText.push(
          ...matchingCommands([newIntegration], searchText, []),
        );
        let list: CommandsCompletion[] = [];
        if (suggestionsMatchingSearchText.length) {
          list = [
            suggestionsHeader,
            ...suggestionsMatchingSearchText,
            newBinding,
          ];
        }

        if (createNewCommandsMatchingSearchText.length) {
          list = [
            ...list,
            createNewHeader,
            ...createNewCommandsMatchingSearchText,
          ];
        }
        const cursor = editor.getCursor();
        editor.showHint({
          hint: () => {
            const hints = {
              list,
              from: {
                ch: cursor.ch - searchText.length - 1,
                line: cursor.line,
              },
              to: editor.getCursor(),
              selectedHint: 1,
            };
            CodeMirror.on(hints, "pick", (selected: CommandsCompletion) => {
              if (selected.action && typeof selected.action === "function") {
                updatePropertyValue(
                  value.slice(0, value.length - searchText.length - 1),
                );
                selected.action();
              } else {
                updatePropertyValue(
                  value.slice(0, value.length - searchText.length - 1) +
                    selected.text,
                );
              }
            });
            CodeMirror.on(hints, "select", (selected: CommandsCompletion) => {
              currentSelection = selected;
            });
            return hints;
          },
          extraKeys: {
            Up: (cm: CodeMirror.Editor, handle: any) => {
              handle.moveFocus(-1);
              if (currentSelection.isHeader === true) {
                handle.moveFocus(-1);
              }
            },
            Down: (cm: CodeMirror.Editor, handle: any) => {
              handle.moveFocus(1);
              if (currentSelection.isHeader === true) {
                handle.moveFocus(1);
              }
            },
          },
          completeSingle: false,
        });
      }
    },
  };
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
