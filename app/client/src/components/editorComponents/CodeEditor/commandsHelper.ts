import CodeMirror from "codemirror";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  AutocompleteDataType,
  CommandsCompletion,
} from "utils/autocomplete/TernServer";
import { generateQuickCommands } from "./generateQuickCommands";
import { Datasource } from "entities/Datasource";
import AnalyticsUtil from "utils/AnalyticsUtil";
import log from "loglevel";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { checkIfCursorInsideBinding } from "components/editorComponents/CodeEditor/codeEditorUtils";
import { SlashCommandPayload } from "entities/Action";

export const commandsHelper: HintHelper = (editor, data: DataTree) => {
  let entitiesForSuggestions = Object.values(data).filter(
    (entity: any) =>
      entity.ENTITY_TYPE && entity.ENTITY_TYPE !== ENTITY_TYPE.APPSMITH,
  );
  return {
    showHint: (
      editor: CodeMirror.Editor,
      { entityId, entityType, expectedType, propertyPath },
      {
        datasources,
        executeCommand,
        pluginIdToImageLocation,
        recentEntities,
        update,
      }: {
        datasources: Datasource[];
        executeCommand: (payload: SlashCommandPayload) => void;
        pluginIdToImageLocation: Record<string, string>;
        recentEntities: string[];
        update: (value: string) => void;
        entityId: string;
      },
    ): boolean => {
      const currentEntityType =
        entityType || ENTITY_TYPE.ACTION || ENTITY_TYPE.JSACTION;
      entitiesForSuggestions = entitiesForSuggestions.filter((entity: any) => {
        return currentEntityType === ENTITY_TYPE.WIDGET
          ? entity.ENTITY_TYPE !== ENTITY_TYPE.WIDGET
          : entity.ENTITY_TYPE !== ENTITY_TYPE.ACTION;
      });
      const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const value = editor.getValue();
      const slashIndex = value.lastIndexOf("/");
      const shouldShowBinding = !cursorBetweenBinding && slashIndex > -1;
      if (shouldShowBinding) {
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
          expectedType || "string",
          entityId,
          propertyPath,
        );
        let currentSelection: CommandsCompletion = {
          origin: "",
          type: AutocompleteDataType.UNKNOWN,
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
                  selected.triggerCompletionsPostPick &&
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
      // @ts-expect-error: Types are not available
      editor.closeHint();
      return false;
    },
  };
};
