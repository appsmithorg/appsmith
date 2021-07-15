import CodeMirror from "codemirror";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { CommandsCompletion } from "utils/autocomplete/TernServer";
import { checkIfCursorInsideBinding } from "./hintHelpers";
import { generateQuickCommands } from "./generateQuickCommands";
import { Datasource } from "entities/Datasource";
import AnalyticsUtil from "utils/AnalyticsUtil";
import log from "loglevel";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

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
        update,
      }: {
        datasources: Datasource[];
        executeCommand: (payload: { actionType: string; args?: any }) => void;
        pluginIdToImageLocation: Record<string, string>;
        recentEntities: string[];
        update: (value: string) => void;
      },
    ): boolean => {
      const currentEntityType = data[entityName]?.ENTITY_TYPE || "ACTION";
      entitiesForSuggestions = entitiesForSuggestions.filter((entity: any) => {
        return currentEntityType === "WIDGET"
          ? entity.ENTITY_TYPE !== "WIDGET"
          : entity.ENTITY_TYPE !== "ACTION";
      });
      const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const value = editor.getValue();
      const slashIndex = value.lastIndexOf("/");
      const shouldShowBinding =
        slashIndex > -1 || (!value && currentEntityType === ENTITY_TYPE.WIDGET);
      if (!cursorBetweenBinding && shouldShowBinding) {
        const searchText = value.substring(slashIndex + 1);
        const list = generateQuickCommands(
          entitiesForSuggestions,
          currentEntityType,
          searchText,
          {
            datasources,
            executeCommand,
            pluginIdToImageLocation,
            recentEntities,
          },
        );
        let currentSelection: CommandsCompletion = {
          origin: "",
          type: "UNKNOWN",
          data: {
            doc: "",
          },
          text: "",
          shortcut: "",
        };
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
              update(value.slice(0, slashIndex) + selected.text);
              setTimeout(() => {
                editor.focus();
                editor.setCursor({
                  line: editor.lineCount() - 1,
                  ch: editor.getLine(editor.lineCount() - 1).length - 2,
                });
                if (selected.action && typeof selected.action === "function") {
                  selected.action();
                } else {
                  CodeMirror.signal(editor, "postPick");
                }
              });
              try {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { data, render, ...rest } = selected;
                const { ENTITY_TYPE, name, pluginType } = data as any;
                AnalyticsUtil.logEvent("SLASH_COMMAND", {
                  ...rest,
                  ENTITY_TYPE,
                  name,
                  pluginType,
                });
              } catch (e) {
                log.debug(e, "Error logging slash command");
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
        return true;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      editor.closeHint();
      return false;
    },
  };
};
