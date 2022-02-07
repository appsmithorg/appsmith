import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Editor } from "@tinymce/tinymce-react";
import { LabelPosition, LABEL_MAX_WIDTH_RATE } from "components/constants";
import { Alignment, Classes, Label, Position } from "@blueprintjs/core";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
import Tooltip from "components/ads/Tooltip";
import { Colors } from "constants/Colors";

const StyledRTEditor = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
  isValid?: boolean;
}>`
  && {
    width: 100%;
    height: 100%;
    border: 1px solid
      ${(props) => (props.isValid ? "none" : Colors.DANGER_SOLID)};
    .tox .tox-editor-header {
      z-index: 0;
    }
  }
  .tox {
    width: 100%;
    .tox-tbtn {
      cursor: pointer;
      .tox-tbtn__select-label {
        cursor: inherit;
      }
    }
  }

  display: flex;
  flex-direction: ${(props) =>
    props.labelPosition === LabelPosition.Left
      ? "row"
      : props.labelPosition === LabelPosition.Top
      ? "column"
      : props.compactMode
      ? "row"
      : "column"};
  align-items: ${({ compactMode, labelPosition }) =>
    labelPosition === LabelPosition.Top
      ? `flex-start`
      : compactMode
      ? `center`
      : `flex-start`};

  ${({ compactMode, labelPosition }) =>
    ((labelPosition !== LabelPosition.Left && !compactMode) ||
      labelPosition === LabelPosition.Top) &&
    `overflow-x: hidden; overflow-y: auto;`}

  label.rich-text-editor-label {
    ${({ compactMode, labelPosition }) =>
      labelPosition === LabelPosition.Top
        ? `margin-bottom: 5px; margin-right: 0px`
        : compactMode || labelPosition === LabelPosition.Left
        ? `margin-bottom: 0px; margin-right: 5px`
        : `margin-bottom: 5px; margin-right: 0px`};
  }
`;

export const TextLabelWrapper = styled.div<{
  compactMode: boolean;
  alignment?: Alignment;
  position?: LabelPosition;
  width?: number;
}>`
  display: flex;
  ${({ alignment, compactMode, position, width }) => `
    ${
      position !== LabelPosition.Top &&
      (position === LabelPosition.Left || compactMode)
        ? `&&& {margin-right: 5px; flex-shrink: 0;} max-width: ${LABEL_MAX_WIDTH_RATE}%;`
        : `width: 100%;`
    }
    ${position === LabelPosition.Left &&
      `
      ${!width && `width: 33%`};
      ${alignment === Alignment.RIGHT && `justify-content: flex-end`};
      label {
        ${width && `width: ${width}px`};
        ${
          alignment === Alignment.RIGHT
            ? `text-align: right`
            : `text-align: left`
        };
      }
    `}
  `}
`;

export const StyledLabel = styled(Label)<{
  $disabled: boolean;
  $labelText?: string;
  $labelTextColor?: string;
  $labelTextSize?: TextSize;
  $labelStyle?: string;
  disabled?: boolean;
}>`
  overflow-y: hidden;
  text-overflow: ellipsis;
  text-align: left;
  color: ${(props) =>
    props.disabled ? Colors.GREY_8 : props.$labelTextColor || "inherit"};
  font-size: ${(props) =>
    props.$labelTextSize ? TEXT_SIZES[props.$labelTextSize] : "14px"};
  font-weight: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
`;

export const StyledTooltip = styled(Tooltip)`
  overflow: hidden;
`;

export const RichTextEditorInputWrapper = styled.div`
  display: flex;
  width: 100%;
  min-width: 0;
  height: 100%;
`;

export interface RichtextEditorComponentProps {
  value?: string;
  isMarkdown: boolean;
  placeholder?: string;
  widgetId: string;
  isDisabled: boolean;
  isVisible?: boolean;
  compactMode: boolean;
  isToolbarHidden: boolean;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  height: number;
  width: number;
  isValid?: boolean;
  onValueChange: (valueAsString: string) => void;
}
const initValue = "<p></p>";
export function RichtextEditorComponent(props: RichtextEditorComponentProps) {
  const {
    compactMode,
    height,
    isDisabled,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelWidth,
    widgetId,
    width,
  } = props;

  const [hasLabelEllipsis, setHasLabelEllipsis] = useState(false);

  const [value, setValue] = React.useState<string>(props.value as string);
  const editorRef = useRef<any>(null);
  const isInit = useRef<boolean>(false);

  const toolbarConfig =
    "undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table | help";

  useEffect(() => {
    if (!value && !props.value) return;
    // This Prevents calling onTextChange when initialized
    if (!isInit.current) return;
    const timeOutId = setTimeout(() => props.onValueChange(value), 1000);
    return () => clearTimeout(timeOutId);
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    setValue(props.value as string);
  }, [props.value]);

  useEffect(() => {
    setHasLabelEllipsis(checkHasLabelEllipsis());
  }, [height, width, labelText, labelPosition, labelWidth]);

  const checkHasLabelEllipsis = useCallback(() => {
    const labelElement = document.querySelector(
      `.appsmith_widget_${widgetId} .rich-text-editor-label`,
    );

    if (labelElement) {
      return labelElement.scrollWidth > labelElement.clientWidth;
    }

    return false;
  }, []);

  const onEditorChange = (newValue: string) => {
    // Prevents cursur shift in Markdown
    if (newValue === "" && props.isMarkdown) {
      setValue(initValue);
    } else {
      setValue(newValue);
    }
  };

  return (
    <StyledRTEditor
      className={`container-${props.widgetId}`}
      compactMode={compactMode}
      isValid={props.isValid}
      labelPosition={labelPosition}
    >
      {labelText && (
        <TextLabelWrapper
          alignment={labelAlignment}
          compactMode={compactMode}
          position={labelPosition}
          width={labelWidth}
        >
          {hasLabelEllipsis ? (
            <StyledTooltip
              content={labelText}
              hoverOpenDelay={200}
              position={Position.TOP}
            >
              <StyledLabel
                $disabled={isDisabled}
                $labelStyle={labelStyle}
                $labelText={labelText}
                $labelTextColor={labelTextColor}
                $labelTextSize={labelTextSize}
                className={`rich-text-editor-label ${Classes.TEXT_OVERFLOW_ELLIPSIS}`}
                disabled={isDisabled}
              >
                {labelText}
              </StyledLabel>
            </StyledTooltip>
          ) : (
            <StyledLabel
              $disabled={isDisabled}
              $labelStyle={labelStyle}
              $labelText={labelText}
              $labelTextColor={labelTextColor}
              $labelTextSize={labelTextSize}
              className={`rich-text-editor-label ${Classes.TEXT_OVERFLOW_ELLIPSIS}`}
              disabled={isDisabled}
            >
              {labelText}
            </StyledLabel>
          )}
        </TextLabelWrapper>
      )}
      <RichTextEditorInputWrapper>
        <Editor
          disabled={props.isDisabled}
          id={`rte-${props.widgetId}`}
          init={{
            height: "100%",
            menubar: false,
            toolbar_mode: "sliding",
            forced_root_block: false,
            branding: false,
            resize: false,
            plugins: [
              "advlist autolink lists link image charmap print preview anchor",
              "searchreplace visualblocks code fullscreen",
              "insertdatetime media table paste code help",
            ],
          }}
          key={`editor_${props.isToolbarHidden}`}
          onEditorChange={onEditorChange}
          onInit={(evt, editor) => {
            editorRef.current = editor;
            isInit.current = true;
          }}
          tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.10.1/tinymce.min.js"
          toolbar={props.isToolbarHidden ? false : toolbarConfig}
          value={value}
        />
      </RichTextEditorInputWrapper>
    </StyledRTEditor>
  );
}

export default RichtextEditorComponent;
