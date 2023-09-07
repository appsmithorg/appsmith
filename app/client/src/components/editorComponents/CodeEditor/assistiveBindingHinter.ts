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
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { SlashCommandPayload } from "entities/Action";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import store from "store";
import { getActionsForCurrentPage } from "selectors/entitiesSelector";

const PARTIAL_BINDING = "{}";

export const assistiveBindingHinter: HintHelper = (
  editor,
  data: DataTree,
  entitiesForNavigation?: EntityNavigationData,
) => {
  const entitiesForSuggestions: any[] = Object.values(
    entitiesForNavigation || {},
  );
  const appState = store.getState();
  const actions = getActionsForCurrentPage(appState);

  for (const navEntity of entitiesForSuggestions) {
    if (navEntity.type === ENTITY_TYPE.ACTION) {
      const action = actions.find(
        (action) => action.config.id === navEntity.id,
      );
      const pluginId = action?.config.pluginId;
      navEntity.pluginId = pluginId;
    }
  }

  return {
    showHint: (
      editor: CodeMirror.Editor,
      entityInfo: FieldEntityInformation,
      {
        enableAIAssistance,
        executeCommand,
        featureFlags,
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
      },
    ): boolean => {
      // @ts-expect-error: Types are not available
      editor.closeHint();
      const currentEntityName = entityInfo.entityName;
      const currentEntityType = entityInfo.entityType || ENTITY_TYPE.WIDGET;

      const filterEntityListForSuggestion = entitiesForSuggestions.filter(
        (e) => e.name !== currentEntityName,
      );

      // const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const value = editor.getValue();
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
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const { data, render, ...rest } = selected; DELETE
      // const { ENTITY_TYPE, name, pluginType } = data as any; DELETE
      if (!list.length) return false;

      AnalyticsUtil.logEvent("ASSISTIVE_JS_BINDING_TRIGGERED", {
        query: value,
        suggestedOptionCount: list.filter(
          (item) => item.className === "CodeMirror-commands",
        ).length,
        entityType: entityInfo.entityType,
      });

      let currentSelection: CommandsCompletion = {
        origin: "",
        type: AutocompleteDataType.UNKNOWN,
        data: {
          doc: "",
        },
        text: "",
        shortcut: "",
      };
      editor.showHint({
        hint: () => {
          const hints = {
            list,
            from: {
              ch: 0,
              line: 0,
            },
            to: {
              ch: value.length,
              line: 0,
            },
            selectedHint: list[0]?.isHeader ? 1 : 0,
          };
          function handleSelection(selected: CommandsCompletion) {
            currentSelection = selected;
          }
          function handlePick(selected: CommandsCompletion) {
            const cursorPosition = selected.text.length - 2;
            setTimeout(() => {
              editor.focus();
              editor.setCursor({
                line: 0,
                ch: cursorPosition,
              });
            });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data } = selected;
            const { name, type } = data as any;
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
        alignWithWord: false,
      });
      return true;
    },
  };
};
