import React, { useCallback } from "react";
import { MenuItem, Text } from "@appsmith/ads";
import { useDispatch } from "react-redux";
import type { JSCollection } from "entities/JSCollection";
import { updateJSCollectionBody } from "actions/jsPaneActions";
import {
  autoIndentCode,
  getAutoIndentShortcutKeyText,
} from "components/editorComponents/CodeEditor/utils/autoIndentUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

interface Props {
  jsAction: JSCollection;
  disabled?: boolean;
}

const prettifyCodeKeyboardShortCut = getAutoIndentShortcutKeyText();

export const Prettify = ({ disabled, jsAction }: Props) => {
  const dispatch = useDispatch();

  const handleSelect = useCallback(() => {
    const editorElement = document.querySelector(".CodeMirror");

    if (
      editorElement &&
      "CodeMirror" in editorElement &&
      editorElement.CodeMirror
    ) {
      const editor = editorElement.CodeMirror as CodeMirror.Editor;

      autoIndentCode(editor);
      dispatch(updateJSCollectionBody(editor.getValue(), jsAction.id));
      AnalyticsUtil.logEvent("PRETTIFY_CODE_MANUAL_TRIGGER");
    }
  }, [jsAction.id, jsAction.name]);

  return (
    <MenuItem disabled={disabled} onSelect={handleSelect} startIcon="code">
      <Text color={"var(--ads-v2-color-fg)"}>Prettify code</Text>
      <Text
        color={"var(--ads-v2-color-fg-muted)"}
        kind="body-s"
        style={{ marginLeft: "7px" }}
      >
        {prettifyCodeKeyboardShortCut}
      </Text>
    </MenuItem>
  );
};
