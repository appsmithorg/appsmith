import React from "react";
import ReactDOM from "react-dom";
import CodeMirror from "codemirror";
import { getDynamicStringSegments } from "utils/DynamicBindingUtils";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { CommandsCompletion } from "utils/autocomplete/TernServer";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api-colored.svg";
import { ReactComponent as DataSourcesColoredIcon } from "assets/icons/menu/datasource-colored.svg";
import { PluginType } from "entities/Action";
import history from "utils/history";
import { QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";

export const commandsHelper: HintHelper = () => {
  return {
    showHint: (
      editor: CodeMirror.Editor,
      _: string,
      __: string,
      {
        actions,
        createNewAPI,
        createNewQuery,
        datasources,
        plugins,
        updatePropertyValue,
      },
    ) => {
      const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const value = editor.getValue();
      const suggestionsHeader: CommandsCompletion = commandsHeader(
        "Suggestions",
      );
      const pluginIdToIconLocationMap = plugins.reduce((acc: any, p: any) => {
        acc[p.id] = p.iconLocation;
        return acc;
      }, {});
      const createNewHeader: CommandsCompletion = commandsHeader("Create New");
      const newQueryHeader: CommandsCompletion = commandsHeader("New Query");
      const actionsHeader: CommandsCompletion = commandsHeader("Actions");
      const insertBinding: CommandsCompletion = {
        text: "{{}}",
        displayText: "Insert Binding",
        data: { doc: "" },
        origin: "",
        type: "UNKNOWN",
        className: "CodeMirror-commands",
        shortcut: "{{}}",
        render: (element: HTMLElement, self: any, data: any) => {
          ReactDOM.render(
            <Command name={data.displayText} shortcut={data.shortcut} />,
            element,
          );
        },
      };
      const { pageId } = fetchAppAndPageId();
      const newAPI: CommandsCompletion = {
        text: "",
        displayText: "New API",
        data: { doc: "" },
        origin: "",
        type: "UNKNOWN",
        className: "CodeMirror-commands",
        action: () => createNewAPI(pageId),
        shortcut: "api.new",
        render: (element: HTMLElement, self: any, data: any) => {
          ReactDOM.render(
            <Command name={data.displayText} shortcut={data.shortcut} />,
            element,
          );
        },
      };
      const newDatasource: CommandsCompletion = {
        text: "",
        displayText: "New Datasource",
        data: { doc: "" },
        origin: "",
        type: "UNKNOWN",
        className: "CodeMirror-commands",
        action: () => history.push(QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID()),
        shortcut: "datasource.new",
        render: (element: HTMLElement, self: any, data: any) => {
          ReactDOM.render(
            <Command name={data.displayText} shortcut={data.shortcut} />,
            element,
          );
        },
      };
      let currentSelection: CommandsCompletion = {
        origin: "",
        type: "UNKNOWN",
        data: {
          doc: "",
        },
        text: "",
        shortcut: "",
      };
      const slashIndex = value.lastIndexOf("/");
      if (!cursorBetweenBinding && slashIndex > -1) {
        const searchText = value.substring(slashIndex + 1);
        const actionCommands = actions
          .map((action: any) => action.config)
          .map((action: any) => {
            return {
              text: `{{${action.name}.data}}`,
              displayText: `${action.name}`,
              className: "CodeMirror-commands",
              shortcut: "{{}}",
              data: action,
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
            text: `{{${action.name}.data}}`,
            displayText: `${action.name}`,
            className: "CodeMirror-commands",
            shortcut: `${action.name}.new`,
            data: action,
            action: () => createNewQuery(action, pageId),
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
        const actionCommandsMatchSearchText = matchingCommands(
          actionCommands,
          searchText,
        );
        const datasourceCommandsMatchingSearchText = matchingCommands(
          datasourceCommands,
          searchText,
        );
        const createNewCommandsMatchingSearchText = matchingCommands(
          [insertBinding, newAPI, newDatasource],
          searchText,
          3,
        );
        let list: CommandsCompletion[] = [];
        if (actionCommandsMatchSearchText.length) {
          list = [suggestionsHeader, ...actionCommandsMatchSearchText];
        }

        if (createNewCommandsMatchingSearchText.length) {
          list = [
            ...list,
            createNewHeader,
            ...createNewCommandsMatchingSearchText,
          ];
        }
        if (datasourceCommandsMatchingSearchText.length) {
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
              if (selected.action) {
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
  list: CommandsCompletion[],
  searchText: string,
  limit = 2,
) => {
  return list
    .filter((action: any) => {
      return (
        action.displayText.toLowerCase().startsWith(searchText.toLowerCase()) ||
        action.shortcut.toLowerCase().startsWith(searchText.toLowerCase())
      );
    })
    .slice(0, limit);
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

const fetchAppAndPageId = () => {
  const pathSplit = location.pathname.split("/");
  const applicationsIndex = pathSplit.findIndex(
    (path) => path === "applications",
  );
  const pagesIndex = pathSplit.findIndex((path) => path === "pages");
  const applicationId = pathSplit[applicationsIndex + 1];
  const pageId = pathSplit[pagesIndex + 1];
  return { applicationId, pageId };
};

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
            SAAS: "",
          }[props.pluginType]}
        {props.imgSrc && <img src={props.imgSrc} />}
        <span>{props.name}</span>
      </div>
      <span className="shortcut">{props.shortcut}</span>
    </div>
  );
}
