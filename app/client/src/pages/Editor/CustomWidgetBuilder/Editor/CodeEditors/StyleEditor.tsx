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
import { Icon, Tooltip, Spinner } from "@appsmith/ads";
import styles from "./styles.module.css";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import styled from "styled-components";

const StyledWrapper = styled.div`
  position: relative;

  span.cm-error {
    color: #2d2006;
  }
`;

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
          .concat([
            "--appsmith-ui-width",
            "--appsmith-ui-height",
            "--appsmith-theme-primaryColor",
            "--appsmith-theme-backgroundColor",
            "--appsmith-theme-borderRadius",
            "--appsmith-theme-boxShadow",
          ])
      : [];
  }, [model]);

  return (
    <Tooltip
      content={
        <ol>
          <li className="mb-1">
            -{" "}
            {createMessage(
              CUSTOM_WIDGET_FEATURE.builder.editor.css.contextTooltipScss,
            )}
          </li>
          <li>
            <div>
              -{" "}
              {createMessage(
                CUSTOM_WIDGET_FEATURE.builder.editor.css
                  .contextTooltipVariables,
              )}
            </div>
            <ol className="ml-3">
              {variableList.map((value, index) => (
                <li key={index}>{value}</li>
              ))}
            </ol>
          </li>
        </ol>
      }
      placement={isReferenceOpen ? "bottom" : "left"}
    >
      <Icon name="question" size="md" />
    </Tooltip>
  );
}

export default function CSSEditor(props: ContentProps) {
  const [loading, setLoading] = useState(true);

  const { showConnectionLostMessage, uncompiledSrcDoc, update } = useContext(
    CustomWidgetBuilderContext,
  );

  const { height } = props;

  return (
    <StyledWrapper>
      <LazyCodeEditor
        border={CodeEditorBorder.NONE}
        borderLess
        className={"js-editor"}
        disabled={showConnectionLostMessage}
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
    </StyledWrapper>
  );
}
