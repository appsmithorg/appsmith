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

const PARTIAL_BINDING = "{}";

export const assistiveBindingHinter: HintHelper = (
  editor,
  data: DataTree,
  entitiesForNavigation?: EntityNavigationData,
) => {
  let entitiesForSuggestions: any[] = [];

  Object.keys(data).forEach((entityName) => {
    const entity: any = data[entityName];

    if (entity.ENTITY_TYPE && entity.ENTITY_TYPE !== ENTITY_TYPE.APPSMITH) {
      entitiesForSuggestions.push({
        entityName,
        ...entity,
      });
    }
  });
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
      const currentEntityType =
        entityType || ENTITY_TYPE.ACTION || ENTITY_TYPE.JSACTION;
      entitiesForSuggestions = entitiesForSuggestions.filter((entity: any) => {
        return currentEntityType === ENTITY_TYPE.WIDGET
          ? entity.ENTITY_TYPE !== ENTITY_TYPE.WIDGET
          : entity.ENTITY_TYPE !== ENTITY_TYPE.ACTION;
      });
      // const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const value = editor.getValue();
      if (value.length < 3 && value !== PARTIAL_BINDING) return false;
      // show binding suggestions hinter
      const searchText = value === PARTIAL_BINDING ? "" : value;
      // const list = generateQuickCommands(
      const list = generateAssistiveBindingCommands(
        entitiesForSuggestions,
        currentEntityType,
        searchText,
        {
          datasources,
          executeCommand,
          pluginIdToImageLocation,
          recentEntities,
          featureFlags,
          enableAIAssistance,
          entitiesForNavigation,
        },
      );
      //ASSISTIVE_JS_BINDING_TRIGGERED when not empty
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
            update(selected.text);
            setTimeout(() => {
              editor.focus();
              editor.setCursor({
                line: editor.lineCount() - 1,
                ch: selected.text.length,
              });
            });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data, render, ...rest } = selected;
            const { ENTITY_TYPE, entityName } = data as any;
            const jsLexicalName: string | undefined =
              selected.displayText?.replace(entityName + ".", ""); //name of the variable of functions in JSAction
            const selectedOptionType: string | undefined =
              ENTITY_TYPE !== "JSACTION"
                ? entitiesForNavigation?.[entityName]?.actionType
                : jsLexicalName !== undefined &&
                  entitiesForNavigation?.[entityName]?.children?.[jsLexicalName]
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
