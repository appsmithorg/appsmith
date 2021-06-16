import React from "react";
import ReactDOM from "react-dom";
import CodeMirror from "codemirror";
import { getDynamicStringSegments } from "utils/DynamicBindingUtils";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { CommandsCompletion } from "utils/autocomplete/TernServer";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api-colored.svg";
import { ReactComponent as DataSourcesColoredIcon } from "assets/icons/menu/datasource-colored.svg";
import { PluginType } from "entities/Action";
import { RecentEntity } from "../GlobalSearch/utils";
import sortBy from "lodash/sortBy";

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
        plugins,
        recentEntities,
        updatePropertyValue,
      },
    ) => {
      const currentEntityType = data[entityName]?.ENTITY_TYPE;
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
          "Suggestions",
        );
        const pluginIdToIconLocationMap = plugins.reduce((acc: any, p: any) => {
          acc[p.id] = p.iconLocation;
          return acc;
        }, {});
        const createNewHeader: CommandsCompletion = commandsHeader(
          "Create New",
        );
        const newQueryHeader: CommandsCompletion = commandsHeader("New Query");
        const newBinding: CommandsCompletion = generateCreateNewCommand({
          text: "{{}}",
          displayText: "New Binding",
          shortcut: "{{}}",
        });
        const newAPI: CommandsCompletion = generateCreateNewCommand({
          text: "",
          displayText: "New API",
          action: () =>
            executeCommand({
              actionType: "NEW_API",
              args: {
                callback: updatePropertyValue,
              },
            }),
          shortcut: "api.new",
        });
        const newDatasource: CommandsCompletion = generateCreateNewCommand({
          text: "",
          displayText: "New Datasource",
          action: () => executeCommand({ actionType: "NEW_DATASOURCE" }),
          shortcut: "datasource.new",
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
            text: `{{${name}.data}}`,
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
                  imgSrc={pluginIdToIconLocationMap[data.data.pluginId]}
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
          recentEntities.map((r: RecentEntity) => r.id),
          currentEntityType === "WIDGET" ? 2 : 3,
        );
        const datasourceCommandsMatchingSearchText = matchingCommands(
          datasourceCommands,
          searchText,
          recentEntities.map((r: RecentEntity) => r.id),
        );
        let createNewCommands = [newBinding];
        if (currentEntityType === "WIDGET") {
          createNewCommands = [...createNewCommands, newAPI, newDatasource];
        }
        const createNewCommandsMatchingSearchText = matchingCommands(
          createNewCommands,
          searchText,
          [],
          3,
        );
        let list: CommandsCompletion[] = [];
        if (suggestionsMatchingSearchText.length) {
          list = [suggestionsHeader, ...suggestionsMatchingSearchText];
        }

        if (createNewCommandsMatchingSearchText.length) {
          list = [
            ...list,
            createNewHeader,
            ...createNewCommandsMatchingSearchText,
          ];
        }
        if (
          datasourceCommandsMatchingSearchText.length &&
          currentEntityType === "WIDGET"
        ) {
          list = [
            ...list,
            newQueryHeader,
            ...datasourceCommandsMatchingSearchText,
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

const computeCursorIndex = (editor: CodeMirror.Editor) => {
  const cursor = editor.getCursor();
  let cursorIndex = cursor.ch;
  if (cursor.line > 0) {
    for (let lineIndex = 0; lineIndex < cursor.line; lineIndex++) {
      const line = editor.getLine(lineIndex);
      cursorIndex = cursorIndex + line.length + 1;
    }
  }
  return cursorIndex;
};

const checkIfCursorInsideBinding = (editor: CodeMirror.Editor): boolean => {
  let cursorBetweenBinding = false;
  const value = editor.getValue();
  const cursorIndex = computeCursorIndex(editor);
  const stringSegments = getDynamicStringSegments(value);
  // count of chars processed
  let cumulativeCharCount = 0;
  stringSegments.forEach((segment: string) => {
    const start = cumulativeCharCount;
    const dynamicStart = segment.indexOf("{{");
    const dynamicDoesStart = dynamicStart > -1;
    const dynamicEnd = segment.indexOf("}}");
    const dynamicDoesEnd = dynamicEnd > -1;
    const dynamicStartIndex = dynamicStart + start + 2;
    const dynamicEndIndex = dynamicEnd + start;
    if (
      dynamicDoesStart &&
      cursorIndex >= dynamicStartIndex &&
      ((dynamicDoesEnd && cursorIndex <= dynamicEndIndex) ||
        (!dynamicDoesEnd && cursorIndex >= dynamicStartIndex))
    ) {
      cursorBetweenBinding = true;
    }
    cumulativeCharCount = start + segment.length;
  });
  return cursorBetweenBinding;
};

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
