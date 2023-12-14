import React, { useContext } from "react";
import type { ContentProps } from "./types";
import styles from "./styles.module.css";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { CustomWidgetBuilderContext } from "../..";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { getAppsmithScriptSchema } from "widgets/CustomWidget/component/constants";

export default function JSEditor(props: ContentProps) {
  const { model, uncompiledSrcDoc, update } = useContext(
    CustomWidgetBuilderContext,
  );

  const { height, showHeader = true } = props;

  return (
    <div className={styles.editor}>
      {showHeader && (
        <div className={styles.editorHeader}>
          <div className={styles.editorHeaderTitle}>JS</div>
        </div>
      )}
      <div className={styles.editorBody}>
        <LazyCodeEditor
          additionalDynamicData={getAppsmithScriptSchema(model || {})}
          border={CodeEditorBorder.NONE}
          borderLess
          className={"js-editor"}
          focusElementName="custom-widget-js-editor"
          folding
          height={height - 39}
          hideEvaluatedValue
          input={{
            value: uncompiledSrcDoc?.js,
            onChange: (value) => {
              update?.("js", value);
            },
          }}
          mode={EditorModes.JAVASCRIPT}
          placeholder="// no need to write window onLoad, it is handled by the widget"
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
