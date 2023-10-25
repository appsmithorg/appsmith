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
import { getAIContext } from "@appsmith/components/editorComponents/GPT/trigger";

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
        focusEditor,
        pluginIdToImageLocation,
        recentEntities,
      }: {
        datasources: Datasource[];
        executeCommand: (payload: SlashCommandPayload) => void;
        pluginIdToImageLocation: Record<string, string>;
        recentEntities: string[];
        entityId: string;
        featureFlags: FeatureFlags;
        enableAIAssistance: boolean;
        focusEditor: (focusOnLine?: number, chOffset?: number) => void;
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
      const cursorPosition = editor.getCursor();
      const currentLineValue = editor.getLine(cursorPosition.line);
      const slashIndex = currentLineValue.lastIndexOf("/");
      const shouldShowBinding = !cursorBetweenBinding && slashIndex > -1;
      const searchText = currentLineValue.substring(slashIndex + 1);

      if (!shouldShowBinding) return false;

      const aiContext = getAIContext({
        currentLineValue,
        cursorPosition,
        editor,
        slashIndex,
        entityType,
      });

      if (!aiContext) return false;

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
            if (selected.action && typeof selected.action === "function") {
              const callback = (completion: string) => {
                editor.replaceRange(completion, cursor);
              };
              selected.action(callback);
            }

            // Focus on the editor if the selected command has text
            if (selected.text) {
              focusEditor(cursorPosition.line, 2);
            }

            selected.triggerCompletionsPostPick &&
              CodeMirror.signal(editor, "postPick", selected.displayText);

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
