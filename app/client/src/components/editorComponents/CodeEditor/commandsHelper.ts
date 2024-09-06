import CodeMirror from "codemirror";
import type {
  FieldEntityInformation,
  HintHelper,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import { generateQuickCommands } from "./generateQuickCommands";
import type { Datasource } from "entities/Datasource";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import log from "loglevel";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import {
  checkIfCursorInsideBinding,
  shouldShowSlashCommandMenu,
} from "components/editorComponents/CodeEditor/codeEditorUtils";
import type { SlashCommandPayload } from "entities/Action";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";
import { getAIContext } from "ee/components/editorComponents/GPT/trigger";
import type { Plugin } from "api/PluginApi";

export const getShowHintOptions = (
  list: CommandsCompletion[],
  editor: CodeMirror.Editor,
  focusEditor: (focusOnLine?: number, chOffset?: number) => void,
  searchText: string = "",
) => {
  let currentSelection: CommandsCompletion = {
    data: {},
    text: "",
    shortcut: "",
    displayText: "",
  };
  const cursor = editor.getCursor();
  return {
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
          focusEditor(editor.getCursor().line, 2);
        }

        selected.triggerCompletionsPostPick &&
          CodeMirror.signal(editor, "postPick", selected.displayText);

        try {
          const { data, ...rest } = selected;
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Up: (cm: CodeMirror.Editor, handle: any) => {
        handle.moveFocus(-1);
        if (currentSelection.isHeader === true) {
          handle.moveFocus(-1);
        }
      },
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Down: (cm: CodeMirror.Editor, handle: any) => {
        handle.moveFocus(1);
        if (currentSelection.isHeader === true) {
          handle.moveFocus(1);
        }
      },
    },
    completeSingle: false,
  };
};

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
        pluginIdToPlugin,
        recentEntities,
      }: {
        datasources: Datasource[];
        executeCommand: (payload: SlashCommandPayload) => void;
        pluginIdToPlugin: Record<string, Plugin>;
        recentEntities: string[];
        entityId: string;
        featureFlags: FeatureFlags;
        enableAIAssistance: boolean;
        focusEditor: (focusOnLine?: number, chOffset?: number) => void;
      },
    ): boolean => {
      // @ts-expect-error: Types are not available
      editor.closeHint();
      const { entityType, propertyPath, widgetType } = entityInfo;
      const currentEntityType = entityType || ENTITY_TYPE.ACTION;
      const filteredEntitiesForSuggestions = entitiesForSuggestions.filter(
        (entity) => {
          return entity.type !== currentEntityType;
        },
      );
      const showSlashCommandMenu = shouldShowSlashCommandMenu(
        widgetType,
        propertyPath,
      );
      const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const cursorPosition = editor.getCursor();
      const currentLineValue = editor.getLine(cursorPosition.line);
      const slashIndex = currentLineValue.lastIndexOf("/");
      const shouldShowBinding =
        showSlashCommandMenu || (!cursorBetweenBinding && slashIndex > -1);
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
          pluginIdToPlugin,
          recentEntities,
          featureFlags,
          enableAIAssistance,
        },
        editor,
        focusEditor,
      );
      editor.showHint(
        getShowHintOptions(list, editor, focusEditor, searchText),
      );
      return true;
    },
    fireOnFocus: true,
  };
};
