import React, { useContext, useMemo, useState } from "react";
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
import { Icon, Tooltip, Spinner } from "design-system";
import styles from "./styles.module.css";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";

export function TitleControls() {
  const { isReferenceOpen, model } = useContext(CustomWidgetBuilderContext);

  const variableList = useMemo(() => {
    return model
      ? Object.entries(model)
          .filter(([, value]) => {
            return ["string", "number"].includes(typeof value);
          })
          .map(([key]) => {
            return `--appsmith-model-${key}`;
          })
          .concat(["--appsmith-ui-width", "--appsmith-ui-height"])
      : [];
  }, [model]);

  return (
    <Tooltip
      content={
        <>
          <div>
            {createMessage(
              CUSTOM_WIDGET_FEATURE.builder.editor.css.contextTooltip,
            )}
          </div>
          <div>&nbsp;</div>
          <ol>
            {variableList.map((value, index) => (
              <li key={index}>{value}</li>
            ))}
          </ol>
        </>
      }
      placement={isReferenceOpen ? "bottom" : "left"}
    >
      <Icon name="question" size="md" />
    </Tooltip>
  );
}

export default function CSSEditor(props: ContentProps) {
  const [loading, setLoading] = useState(true);

  const { uncompiledSrcDoc, update } = useContext(CustomWidgetBuilderContext);

  const { height } = props;

  return (
    <div className={styles.wrapper}>
      <LazyCodeEditor
        border={CodeEditorBorder.NONE}
        borderLess
        className={"js-editor"}
        focusElementName="custom-widget-css-editor"
        folding
        height={height}
        hideEvaluatedValue
        ignoreAutoComplete
        ignoreBinding
        ignoreSlashCommand
        input={{
          value: uncompiledSrcDoc?.css,
          onChange: (value) => {
            update?.("css", value);
          },
        }}
        mode={EditorModes.CSS}
        onLoad={() => setLoading(false)}
        placeholder={createMessage(
          CUSTOM_WIDGET_FEATURE.builder.editor.css.placeholder,
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
