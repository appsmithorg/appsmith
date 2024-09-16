import React, { useContext, useState } from "react";
import "codemirror/mode/htmlmixed/htmlmixed";
import type { ContentProps } from "./types";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { CustomWidgetBuilderContext } from "../..";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import styles from "./styles.module.css";
import { Spinner } from "@appsmith/ads";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";

export default function HTMLEditor(props: ContentProps) {
  const [loading, setLoading] = useState(true);

  const { showConnectionLostMessage, uncompiledSrcDoc, update } = useContext(
    CustomWidgetBuilderContext,
  );

  const { height } = props;

  return (
    <div className={styles.wrapper}>
      <LazyCodeEditor
        border={CodeEditorBorder.NONE}
        borderLess
        className={"js-editor"}
        disabled={showConnectionLostMessage}
        focusElementName="custom-widget-html-editor"
        folding
        height={height}
        hideEvaluatedValue
        ignoreAutoComplete
        ignoreBinding
        ignoreSlashCommand
        input={{
          value: uncompiledSrcDoc?.html,
          onChange: (value) => {
            update?.("html", value);
          },
        }}
        mode={EditorModes.HTMLMIXED}
        onLoad={() => setLoading(false)}
        placeholder={createMessage(
          CUSTOM_WIDGET_FEATURE.builder.editor.html.placeholder,
        )}
        showLightningMenu={false}
        showLineNumbers
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={EditorTheme.LIGHT}
      />
      {loading && (
        <div className={styles.loader} style={{ height }}>
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}
