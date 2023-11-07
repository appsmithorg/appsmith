import CodeMirror from "codemirror";
import type {
  FieldEntityInformation,
  HintHelper,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { CommandsCompletion } from "utils/autocomplete/CodemirrorTernService";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { generateAssistiveBindingCommands } from "./assistiveBindingCommands";
import type { Datasource } from "entities/Datasource";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type { SlashCommandPayload } from "entities/Action";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";

const PARTIAL_BINDING = "{}";

export const assistiveBindingHinter: HintHelper = (
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
        update: (value: string) => void;
        entityId: string;
        featureFlags: FeatureFlags;
        enableAIAssistance: boolean;
        focusEditor: (focusOnLine?: number, chOffset?: number) => void;
      },
    ): boolean => {
      // @ts-expect-error: Types are not available
      editor.closeHint();
      const currentEntityName = entityInfo.entityName;
      const currentEntityType =
        entityInfo.entityType || ENTITY_TYPE_VALUE.WIDGET;
      const expectedType =
        entityInfo.expectedType || AutocompleteDataType.UNKNOWN;

      const filterEntityListForSuggestion = entitiesForSuggestions.filter(
        (e) => e.name !== currentEntityName,
      );

      const word = editor.findWordAt(editor.getCursor());
      const value = editor.getRange(word.anchor, word.head);

      if (value.length < 3 && value !== PARTIAL_BINDING) return false;
      const searchText = value === PARTIAL_BINDING ? "" : value;
      const list = generateAssistiveBindingCommands(
        filterEntityListForSuggestion,
        currentEntityType,
        searchText,
        {
          executeCommand,
          pluginIdToImageLocation,
          recentEntities,
          featureFlags,
          enableAIAssistance,
          expectedType,
        },
      );

      if (list.length === 0) return false;

      AnalyticsUtil.logEvent("ASSISTIVE_JS_BINDING_TRIGGERED", {
        query: value,
        suggestedOptionCount: list.filter(
          (item) => item.className === "CodeMirror-commands",
        ).length,
        entityType: entityInfo.entityType,
      });

      let currentSelection: CommandsCompletion = {
        data: {},
        text: "",
        shortcut: "",
      };
      const cursor = editor.getCursor();
      const currentLine = cursor.line;
      const currentCursorPosition =
        value === PARTIAL_BINDING ? cursor.ch + 1 : cursor.ch;

      // CodeMirror hinter needs to have a selected hint.
      // Assistive binding requires that we do not have any completion selected by default.
      // Adds a hidden completion ("\n") that mocks the enter behavior.
      list.unshift({
        text: "\n",
        displayText: "",
        from: cursor,
        to: cursor,
        render: (element: HTMLElement) => {
          element.style.height = "0";
          element.style.marginBottom = "4px";
        },
        data: {},
        shortcut: "",
      });
      const hints = {
        list,
        from: {
          ch: currentCursorPosition - value.length,
          line: currentLine,
        },
        to: {
          ch: currentCursorPosition,
          line: currentLine,
        },
        selectedHint: 0,
      };
      editor.showHint({
        hint: () => {
          function handleSelection(selected: CommandsCompletion) {
            currentSelection = selected;
          }
          function handlePick(selected: CommandsCompletion) {
            if (selected.displayText === "") {
              return;
            }
            const cursor = editor.getCursor();
            const currentLine = cursor.line;
            focusEditor(currentLine, 2);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data } = selected;
            const { name, type } = data as NavigationData;
            const jsLexicalName: string | undefined =
              selected.displayText?.replace(name + ".", ""); //name of the variable of functions in JSAction
            const selectedOptionType: string | undefined =
              type !== "JSACTION"
                ? entitiesForNavigation?.[name]?.actionType
                : jsLexicalName !== undefined &&
                  entitiesForNavigation?.[name]?.children?.[jsLexicalName]
                    .isfunction === true
                ? "JSFunction"
                : "JSVariable";
            AnalyticsUtil.logEvent("ASSISTIVE_JS_BINDING_OPTION_SELECTED", {
              query: value,
              suggestedOptionCount: list.filter(
                (item) => item.className === "CodeMirror-commands",
              ).length, //option count
              selectedOptionType: selectedOptionType,
              selectedOptionIndex: list.findIndex(
                (item) => item.displayText === selected.displayText,
              ),
              entityType: entityInfo.entityType,
            });

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
            if (currentSelection.isHeader) {
              handle.moveFocus(-1);
              if (currentSelection.displayText === "") handle.moveFocus(-1);
            } else if (currentSelection.displayText === "") {
              handle.moveFocus(-1);
              if (currentSelection.isHeader) handle.moveFocus(-1);
            }
          },
          Down: (cm: CodeMirror.Editor, handle: any) => {
            handle.moveFocus(1);
            if (currentSelection.isHeader) {
              handle.moveFocus(1);
              if (currentSelection.displayText === "") handle.moveFocus(1);
            } else if (currentSelection.displayText === "") {
              handle.moveFocus(1);
              if (currentSelection.isHeader) handle.moveFocus(1);
            }
          },
        },
        completeSingle: false,
      });
      return true;
    },
  };
};
