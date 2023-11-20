import React from "react";
import type { ContentProps } from "./types";
import styles from "./styles.module.css";
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

export default function CSSEditor(props: Props) {
  const { height, onChange, showHeader = true } = props;

  return (
    <div className={styles.editor}>
      {showHeader && (
        <div className={styles.editorHeader}>
          <div className={styles.editorHeaderTitle}>CSS</div>
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
          mode={EditorModes.CSS}
          placeholder="/* you can access your string properties of your model using `var(--appsmith-model-<property-name>)`*/"
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
