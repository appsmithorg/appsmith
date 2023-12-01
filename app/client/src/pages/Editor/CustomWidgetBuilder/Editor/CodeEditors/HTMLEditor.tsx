import React, { useContext } from "react";
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
import { CustomWidgetBuilderContext } from "../..";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";

export default function HTMLEditor(props: ContentProps) {
  const { srcDoc, update } = useContext(CustomWidgetBuilderContext);

  const { height, showHeader = true } = props;

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
          focusElementName="custom-widget-html-editor"
          folding
          height={height - 39}
          hideEvaluatedValue
          input={{
            value: srcDoc?.html,
            onChange: (value) => {
              update?.("html", value);
            },
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
