import CodeMirror from "codemirror";
import type {
  FieldEntityInformation,
  HintHelper,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import { generateQuickCommands } from "./generateQuickCommands";
import type { Datasource } from "entities/Datasource";
import AnalyticsUtil from "utils/AnalyticsUtil";
import log from "loglevel";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import { checkIfCursorInsideBinding } from "components/editorComponents/CodeEditor/codeEditorUtils";
import type { SlashCommandPayload } from "entities/Action";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";
import { getJSFunctionLocationFromCursor } from "pages/Editor/JSEditor/utils";

export const slashCommandHintHelper: HintHelper = (
  _,
  entitiesForNavigation: EntityNavigationData,
) => {
  const entitiesForSuggestions: NavigationData[] = Object.values(
    entitiesForNavigation || {},
  );
  return {
    showHint: (
      editor: CodeMirror.Editor,
      entityInfo: FieldEntityInformation,
      {
        datasources,
        enableAIAssistance,
        executeCommand,
        featureFlags,
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
        featureFlags: FeatureFlags;
        enableAIAssistance: boolean;
      },
    ): boolean => {
      // @ts-expect-error: Types are not available
      editor.closeHint();
      const { entityType } = entityInfo;
      const currentEntityType = entityType || ENTITY_TYPE_VALUE.ACTION;
      const filteredEntitiesForSuggestions = entitiesForSuggestions.filter(
        (entity) => {
          return entity.type !== currentEntityType;
        },
      );
      const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const value = editor.getValue();
      const cursorPosition = editor.getCursor();
      const currentLineValue = editor.getLine(cursorPosition.line);
      const slashIndex = currentLineValue.lastIndexOf("/");
      const shouldShowBinding = !cursorBetweenBinding && slashIndex > -1;

      if (!shouldShowBinding) return false;

      const searchText = currentLineValue.substring(slashIndex + 1);
      const editorValue = editor.getValue();
      const aiContext = {
        functionName: "",
        cursorLineNumber: 0,
        functionString: "",
        mode: editor.getMode().name,
        cursorPosition,
        cursorCoordinates: editor.cursorCoords(true, "local"),
      };

      if (entityInfo.entityType === ENTITY_TYPE_VALUE.JSACTION) {
        const lines = editorValue.split("\n");

        const slashCommand = currentLineValue.substring(slashIndex);
        const lineToUpdate = lines[cursorPosition.line];
        const updatedLine =
          lineToUpdate.substring(0, cursorPosition.ch - slashCommand.length) +
          lineToUpdate.substring(cursorPosition.ch);
        lines[cursorPosition.line] = updatedLine;
        const updatedEditorValue = lines.join("\n");

        const { cursorLineNumber, functionName, functionString } =
          getJSFunctionLocationFromCursor(updatedEditorValue, cursorPosition) ||
          {};

        if (!functionName) return false;

        aiContext.functionName = functionName;
        aiContext.cursorLineNumber = cursorLineNumber;
        aiContext.functionString = functionString;
      }

      const list = generateQuickCommands(
        filteredEntitiesForSuggestions,
        currentEntityType,
        searchText,
        {
          aiContext,
          datasources,
          executeCommand,
          pluginIdToImageLocation,
          recentEntities,
          featureFlags,
          enableAIAssistance,
        },
      );
      let currentSelection: CommandsCompletion = {
        data: {},
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
            selectedHint: list[0]?.isHeader ? 1 : 0,
          };
          function handleSelection(selected: CommandsCompletion) {
            currentSelection = selected;
          }
          function handlePick(selected: CommandsCompletion) {
            update(value.slice(0, slashIndex) + selected.text);
            setTimeout(() => {
              editor.focus();
              editor.setCursor({
                line: editor.lineCount() - 1,
                ch: editor.getLine(editor.lineCount() - 1).length - 2,
              });
              if (selected.action && typeof selected.action === "function") {
                selected.action();
              }

              selected.triggerCompletionsPostPick &&
                CodeMirror.signal(editor, "postPick", selected.displayText);
            });
            try {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { data, render, ...rest } = selected;
              const { name, type } = data as NavigationData;
              AnalyticsUtil.logEvent("SLASH_COMMAND", {
                ...rest,
                type,
                name,
              });
            } catch (e) {
              log.debug(e, "Error logging slash command");
            }
            CodeMirror.off(hints, "pick", handlePick);
            CodeMirror.off(hints, "select", handleSelection);
          }
          CodeMirror.on(hints, "pick", handlePick);
          CodeMirror.on(hints, "select", handleSelection);
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
    },
  };
};
