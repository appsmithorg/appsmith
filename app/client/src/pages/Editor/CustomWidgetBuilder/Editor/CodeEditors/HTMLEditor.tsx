import React from "react";
import "codemirror/mode/htmlmixed/htmlmixed";
import styles from "./styles.module.css";
import type { ContentProps } from "./types";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";

type Props = {
  value: string;
} & ContentProps;

export default function HTMLEditor(props: Props) {
  const { height, onChange, showHeader = true } = props;

  return (
    <div className={styles.editor}>
      {showHeader && (
        <div className={styles.editorHeader}>
          <div className={styles.editorHeaderTitle}>HTML</div>
        </div>
      )}
      <div className={styles.editorBody}>
        <LazyCodeEditor
          border={CodeEditorBorder.NONE}
          borderLess
          className={"js-editor"}
          folding
          height={height - 38}
          hideEvaluatedValue
          input={{
            value: props.value,
            onChange,
          }}
          mode={EditorModes.HTMLMIXED}
          placeholder="<!-- no need to write html, head, body tags, it is handled by the widget -->"
          showLightningMenu={false}
          showLineNumbers
          size={EditorSize.EXTENDED}
          tabBehaviour={TabBehaviour.INDENT}
          theme={EditorTheme.LIGHT}
        />
      </div>
    </div>
  );
}
