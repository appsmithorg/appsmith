import CodeMirror from "codemirror";
import TernServer from "utils/autocomplete/TernServer";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { customTreeTypeDefCreator } from "utils/autocomplete/customTreeTypeDefCreator";
import { checkIfCursorInsideBinding } from "components/editorComponents/CodeEditor/codeEditorUtils";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

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
      additionalData,
    ): boolean => {
      if (additionalData && additionalData.blockCompletions) {
        TernServer.setEntityInformation({
          ...entityInformation,
          blockCompletions: additionalData.blockCompletions,
        });
      } else {
        TernServer.setEntityInformation(entityInformation);
      }

      const entityType = entityInformation?.entityType;
      let shouldShow = false;
      if (entityType === ENTITY_TYPE.JSACTION) {
        shouldShow = true;
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
