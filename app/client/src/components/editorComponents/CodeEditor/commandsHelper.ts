import CodeMirror from "codemirror";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { CommandsCompletion } from "utils/autocomplete/TernServer";
import { checkIfCursorInsideBinding } from "./hintHelpers";
import { generateQuickCommands } from "./generateQuickCommands";
import { Datasource } from "entities/Datasource";

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
      }: {
        datasources: Datasource[];
        executeCommand: (payload: { actionType: string; args?: any }) => void;
        pluginIdToImageLocation: Record<string, string>;
        recentEntities: string[];
        updatePropertyValue: (value: string) => void;
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
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: No types available
        editor.closeHint();
      }
    },
  };
};
