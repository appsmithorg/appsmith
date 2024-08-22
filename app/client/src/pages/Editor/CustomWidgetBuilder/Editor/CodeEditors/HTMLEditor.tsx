import React, { useContext, useState } from "react";

import "codemirror/mode/htmlmixed/htmlmixed";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";

import { Spinner } from "@appsmith/ads";

import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";
import type { ContentProps } from "./types";

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
