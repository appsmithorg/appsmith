import React, { useRef, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Editor } from "@tinymce/tinymce-react";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { TextSize } from "constants/WidgetConstants";

import { Colors } from "constants/Colors";
import LabelWithTooltip, {
  labelLayoutStyles,
} from "components/ads/LabelWithTooltip";
import { isMacOs } from "utils/AppsmithUtils";

const StyledRTEditor = styled.div<{
  borderRadius: string;
  boxShadow?: string;
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  && {
    width: 100%;
    height: 100%;
    .tox .tox-editor-header {
      z-index: 0;
    }

    .tox-tinymce {
      border-radius: ${({ borderRadius }) => borderRadius};
      box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
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

  ${labelLayoutStyles}
`;

export const RichTextEditorInputWrapper = styled.div<{
  isValid?: boolean;
  borderRadius: string;
}>`
  display: flex;
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 1px solid ${(props) => (props.isValid ? "none" : Colors.DANGER_SOLID)};
  border-radius: ${({ borderRadius }) => borderRadius};
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
  borderRadius: string;
  boxShadow?: string;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  isValid?: boolean;
  onValueChange: (valueAsString: string) => void;
}

export function RichtextEditorComponent(props: RichtextEditorComponentProps) {
  const {
    compactMode,
    isDisabled,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelWidth,
  } = props;

  const [editorValue, setEditorValue] = useState<string>(props.value as string);
  const initialRender = useRef(true);

  const toolbarConfig =
    "insertfile undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | removeformat | table | print preview media | forecolor backcolor emoticons' | help";

  const handleEditorChange = useCallback(
    (newValue: string, editor: any) => {
      // avoid updating value, when there is no actual change.
      if (newValue !== editorValue) {
        const isFocused = editor.hasFocus();
        /**
         * only change call the props.onValueChange when the editor is in focus.
         * This prevents props.onValueChange from getting called whenever the defaultText is changed.
         */
        //
        if (isFocused) {
          setEditorValue(newValue);
          props.onValueChange(newValue);
        }
      }
    },
    [props.onValueChange, editorValue],
  );

  // As this useEffect sets the initialRender.current value as false and order of hooks matter,
  // we should always keep this useEffect logic at last part of component before return to make sure, initialRender.current value is consumed as expected in the component.
  useEffect(() => {
    if (!initialRender.current && editorValue !== props.value) {
      setEditorValue(props.value as string);
    } else {
      initialRender.current = false;
    }
  }, [props.value]);

  return (
    <StyledRTEditor
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      className={`container-${props.widgetId}`}
      compactMode={compactMode}
      data-testid="rte-container"
      labelPosition={labelPosition}
    >
      {labelText && (
        <LabelWithTooltip
          alignment={labelAlignment}
          className={`rich-text-editor-label`}
          color={labelTextColor}
          compact={compactMode}
          disabled={isDisabled}
          fontSize={labelTextSize}
          fontStyle={labelStyle}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
      )}
      <RichTextEditorInputWrapper
        borderRadius={props.borderRadius}
        isValid={props.isValid}
      >
        <Editor
          disabled={props.isDisabled}
          id={`rte-${props.widgetId}`}
          init={{
            height: "100%",
            menubar: false,
            toolbar_mode: "sliding",
            forced_root_block: "p",
            branding: false,
            resize: false,
            browser_spellcheck: true,
            plugins: [
              "advlist autolink lists link image charmap print preview anchor",
              "searchreplace visualblocks code fullscreen",
              "insertdatetime media table paste code help",
            ],
            contextmenu: "link useBrowserSpellcheck image table",
            setup: function(editor) {
              editor.ui.registry.addMenuItem("useBrowserSpellcheck", {
                text: `Use "${
                  isMacOs() ? "Control" : "Ctrl"
                } + Right click" to access spellchecker`,
                onAction: function() {
                  editor.notificationManager.open({
                    text: `To access the spellchecker, hold the ${
                      isMacOs() ? "Control" : "Ctrl"
                    } key and right-click on the misspelt word.`,
                    type: "info",
                    timeout: 5000,
                    closeButton: true,
                  });
                },
              });
              editor.ui.registry.addContextMenu("useBrowserSpellcheck", {
                update: function() {
                  return editor.selection.isCollapsed()
                    ? ["useBrowserSpellcheck"]
                    : [];
                },
              });
            },
          }}
          key={`editor_${props.isToolbarHidden}`}
          onEditorChange={handleEditorChange}
          tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.10.1/tinymce.min.js"
          toolbar={props.isToolbarHidden ? false : toolbarConfig}
          value={editorValue}
        />
      </RichTextEditorInputWrapper>
    </StyledRTEditor>
  );
}

export default RichtextEditorComponent;
