import CodeMirror from "codemirror";
import TernServer from "utils/autocomplete/TernServer";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { customTreeTypeDefCreator } from "utils/autocomplete/customTreeTypeDefCreator";
import { checkIfCursorInsideBinding } from "components/editorComponents/CodeEditor/codeEditorUtils";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { generateTypeDef } from "utils/autocomplete/dataTreeTypeDefCreator";
import { getJSObjectProperty } from "./utils";
import { Def } from "tern";

export const bindingHint: HintHelper = (editor, dataTree, customDataTree) => {
  if (customDataTree) {
    const customTreeDef = customTreeTypeDefCreator(customDataTree);
    TernServer.updateDef("customDataTree", customTreeDef);
  } else {
    TernServer.updateDef("customDataTree", {});
  }

  editor.setOption("extraKeys", {
    // @ts-expect-error: Types are not available
    ...editor.options.extraKeys,
    [KeyboardShortcuts.CodeEditor.OpenAutocomplete]: (cm: CodeMirror.Editor) =>
      checkIfCursorInsideBinding(cm) && TernServer.complete(cm),
    [KeyboardShortcuts.CodeEditor.ShowTypeAndInfo]: (cm: CodeMirror.Editor) => {
      TernServer.showType(cm);
    },
    [KeyboardShortcuts.CodeEditor.OpenDocsLink]: (cm: CodeMirror.Editor) => {
      TernServer.showDocs(cm);
    },
  });
  return {
    showHint: (
      editor: CodeMirror.Editor,
      entityInformation,
      { dataTreeForAutoComplete }: { dataTreeForAutoComplete: DataTree },
    ): boolean => {
      TernServer.setEntityInformation(entityInformation);
      const entityType = entityInformation?.entityType;
      let shouldShow = false;
      if (entityType === ENTITY_TYPE.JSACTION) {
        shouldShow = true;

        // If focused/modified JSEditor has changed
        if (dataTreeForAutoComplete && entityInformation.entityName) {
          const JSObject = getJSObjectProperty({
            dataTreeForAutoComplete,
            JSObjectName: entityInformation.entityName,
          });
          const JSObjectFocusedDef = generateTypeDef(JSObject) as Def;

          TernServer.updateDef("JSOBJECT_GLOBAL", JSObjectFocusedDef);
        }
      } else {
        shouldShow = checkIfCursorInsideBinding(editor);
      }
      if (shouldShow) {
        AnalyticsUtil.logEvent("AUTO_COMPLETE_SHOW", {});
        TernServer.complete(editor);
        return true;
      }
      // @ts-expect-error: Types are not available
      editor.closeHint();
      return shouldShow;
    },
  };
};
