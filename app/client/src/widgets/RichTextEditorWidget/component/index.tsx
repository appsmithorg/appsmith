import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/plugins/paste";
import "tinymce/plugins/link";
import "tinymce/plugins/image";
import "tinymce/plugins/table";
import "tinymce/plugins/code";
import "tinymce/plugins/help";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/media";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/lists";
import "tinymce/plugins/charmap";
import "tinymce/plugins/preview";
import "tinymce/plugins/anchor";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/emoticons";
import "tinymce/plugins/print";
import "tinymce/themes/silver";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.min.css";
import React, { useRef, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Editor } from "@tinymce/tinymce-react";
import type { LabelPosition } from "components/constants";
import type { Alignment } from "@blueprintjs/core";
import type { TextSize } from "constants/WidgetConstants";

// @ts-expect-error: loader types not available
import cssVariables from "!!raw-loader!theme/wds.css";
import { isMacOs } from "utils/AppsmithUtils";
import LabelWithTooltip, {
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
} from "widgets/components/LabelWithTooltip";

const StyledRTEditor = styled.div<{
  borderRadius: string;
  boxShadow?: string;
  compactMode: boolean;
  labelPosition?: LabelPosition;
  isValid?: boolean;
  isDisabled?: boolean;
  isDynamicHeightEnabled?: boolean;
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
    font-family: inherit;

    width: 100%;
    .tox-tbtn {
      cursor: pointer;
      .tox-tbtn__select-label {
        cursor: inherit;
      }
    }
  }

  .tox .tox-toolbar__primary {
    background: ${(props) =>
      props.isDisabled
        ? "var(--wds-color-bg-disabled)"
        : "var(--wds-color-bg)"};
  }

  .tox .tox-edit-area__iframe {
    background: ${(props) =>
      props.isDisabled
        ? "var(--wds-color-bg-disabled)"
        : "var(--wds-color-bg)"};
  }

  .tox-tinymce {
    border: 1px solid
      ${(props) =>
        props.isValid
          ? "var(--wds-color-border)"
          : "var(--wds-color-border-danger)"};
  }

  &.disabled {
    cursor: not-allowed !important;
  }

  &.disabled .tox {
    pointer-events: none;
  }

  &:not(.disabled):hover .tox-tinymce {
    border: 1px solid
      ${(props) =>
        props.isValid
          ? "var(--wds-color-border-hover)"
          : "var(--wds-color-border-danger-hover)"};
  }

  .tox .tox-statusbar {
    background: ${(props) =>
      props.isDisabled
        ? "var(--wds-color-bg-disabled)"
        : "var(--wds-color-bg)"};
  }

  .tox:not([dir="rtl"]) .tox-toolbar__group:not(:last-of-type) {
    border-right: none;
    border-bottom: none;
    position: relative;

    &::after {
      content: "";
      height: 39px;
      width: 1px;
      position: absolute;
      right: 0;
      background: var(--wds-color-border);
    }
  }

  .tox:not([dir="rtl"]) .tox-toolbar__group:not(:last-of-type),
  .tox .tox-statusbar {
    border-color: var(--wds-color-border);
  }

  .tox .tox-tbtn svg,
  #tox-icon-highlight-bg-color__color,
  #tox-icon-text-color__color {
    fill: ${(props) =>
      props.isDisabled
        ? "var(--wds-color-icon-disabled)"
        : "var(--wds-color-icon)"};
  }

  .tox .tox-tbtn {
    margin: 3px 0 2px 0;
    border-radius: ${({ borderRadius }) => borderRadius};

    &:hover {
      background: var(--wds-color-bg-hover);
    }
  }

  .tox .tox-toolbar,
  .tox .tox-toolbar__overflow {
    background: linear-gradient(
      to bottom,
      var(--wds-color-border) 1px,
      transparent 1px
    );
    background-color: ${(props) =>
      props.isDisabled
        ? "var(--wds-color-bg-disabled)"
        : "var(--wds-color-bg)"};
    background-size: auto 39px;
  }

  .tox-editor-header {
    border-bottom: 1px solid var(--wds-color-border);
  }

  .tox-tbtn__select-label {
    color: ${(props) =>
      props.isDisabled
        ? "var(--wds-color-text-disabled)"
        : "var(--wds-color-text)"};
  }

  .tox .tox-split-button {
    margin: 3px 0 2px 0;
    border-radius: ${({ borderRadius }) => borderRadius};

    &:hover {
      box-shadow: 0 0 0 1px var(--wds-color-border) inset;
    }
    &:focus {
      background: var(--wds-color-bg-focus);
    }
    &:active {
      background: var(--wds-color-bg-focus);
    }
  }

  .tox .tox-tbtn:focus:not(.tox-tbtn--disabled) {
    background: var(--wds-color-bg-selected);
  }

  .tox .tox-tbtn:active:not(.tox-tbtn--disabled) {
    background: var(--wds-color-bg-focus);
  }

  .tox .tox-split-button__chevron {
    width: 24px;
    padding-right: 0px;
  }

  .tox .tox-tbtn--enabled {
    background: var(--wds-color-bg-focus);
    color: var(--wds-color-text);

    .tox-tbtn svg,
    .tox-tbtn__icon-wrap svg,
    #tox-icon-highlight-bg-color__color,
    #tox-icon-text-color__color {
      fill: ${(props) =>
        props.isDisabled
          ? "var(--wds-color-icon-disabled)"
          : "var(--wds-color-text)"};
    }
  }

  .tox .tox-toolbar__group {
    height: 39px;
  }

  .tox .tox-tbtn--disabled svg,
  .tox .tox-tbtn--disabled:hover svg,
  .tox .tox-tbtn:disabled svg,
  .tox .tox-tbtn:disabled:hover svg {
    fill: var(--wds-color-icon-disabled);
  }

  ${labelLayoutStyles}

  & .${LABEL_CONTAINER_CLASS} {
    align-self: center;
  }
`;

export const RichTextEditorInputWrapper = styled.div<{
  isValid?: boolean;
  borderRadius: string;
  isDynamicHeightEnabled?: boolean;
}>`
  display: flex;
  width: 100%;
  min-width: 0;
  height: 100%;
  border-radius: ${({ borderRadius }) => borderRadius};

  ${({ isDynamicHeightEnabled }) =>
    isDynamicHeightEnabled ? "&& { height: auto; min-height: 192px; }" : ""};
`;

export interface RichtextEditorComponentProps {
  value?: string;
  isMarkdown: boolean;
  placeholder?: string;
  widgetId: string;
  isDisabled: boolean;
  isVisible?: boolean;
  compactMode: boolean;
  isDynamicHeightEnabled: boolean;
  isToolbarHidden: boolean;
  borderRadius: string;
  boxShadow?: string;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelTooltip?: string;
  labelStyle?: string;
  isValid?: boolean;
  onValueChange: (valueAsString: string) => void;
}

function RichtextEditorComponent(props: RichtextEditorComponentProps) {
  const {
    compactMode,
    isDisabled,
    isDynamicHeightEnabled,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelTooltip,
    labelWidth,
  } = props;

  const [editorValue, setEditorValue] = useState<string>(props.value as string);
  const initialRender = useRef(true);

  const toolbarConfig =
    "insertfile undo redo | formatselect | bold italic underline backcolor forecolor | lineheight | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | removeformat | table | print preview media | emoticons |help";

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
      className={`container-${props.widgetId} ${
        props.isDisabled ? "disabled" : ""
      }`}
      compactMode={compactMode}
      data-testid="rte-container"
      isDisabled={props.isDisabled}
      isDynamicHeightEnabled={isDynamicHeightEnabled}
      isValid={props.isValid}
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
          helpText={labelTooltip}
          isDynamicHeightEnabled={isDynamicHeightEnabled}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
      )}
      <RichTextEditorInputWrapper
        borderRadius={props.borderRadius}
        isDynamicHeightEnabled={isDynamicHeightEnabled}
        isValid={props.isValid}
      >
        <Editor
          disabled={props.isDisabled}
          id={`rte-${props.widgetId}`}
          init={{
            height: isDynamicHeightEnabled ? "auto" : "100%",
            menubar: false,
            toolbar_mode: "sliding",
            forced_root_block: "p",
            branding: false,
            resize: false,
            browser_spellcheck: true,
            content_style: `
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.4;
              margin: 1rem;
            }
            table {
              border-collapse: collapse;
            }
            /* Apply a default padding if legacy cellpadding attribute is missing */
            table:not([cellpadding]) th,
            table:not([cellpadding]) td {
              padding: 0.4rem;
            }
            /* Set default table styles if a table has a positive border attribute
               and no inline css */
            table[border]:not([border="0"]):not([style*="border-width"]) th,
            table[border]:not([border="0"]):not([style*="border-width"]) td {
              border-width: 1px;
            }
            /* Set default table styles if a table has a positive border attribute
               and no inline css */
            table[border]:not([border="0"]):not([style*="border-style"]) th,
            table[border]:not([border="0"]):not([style*="border-style"]) td {
              border-style: solid;
            }
            /* Set default table styles if a table has a positive border attribute
               and no inline css */
            table[border]:not([border="0"]):not([style*="border-color"]) th,
            table[border]:not([border="0"]):not([style*="border-color"]) td {
              border-color: #ccc;
            }
            figure {
              display: table;
              margin: 1rem auto;
            }
            figure figcaption {
              color: #999;
              display: block;
              margin-top: 0.25rem;
              text-align: center;
            }
            hr {
              border-color: #ccc;
              border-style: solid;
              border-width: 1px 0 0 0;
            }
            code {
              background-color: #e8e8e8;
              border-radius: 3px;
              padding: 0.1rem 0.2rem;
            }
            .mce-content-body:not([dir=rtl]) blockquote {
              border-left: 2px solid #ccc;
              margin-left: 1.5rem;
              padding-left: 1rem;
            }
            .mce-content-body[dir=rtl] blockquote {
              border-right: 2px solid #ccc;
              margin-right: 1.5rem;
              padding-right: 1rem;
            }
              ${cssVariables}
              ${
                props.isDisabled
                  ? `* {
                  color: var(--wds-color-text-disabled)
                }`
                  : ""
              }`,
            plugins: [
              "advlist autolink lists link image charmap print preview anchor",
              "searchreplace visualblocks code fullscreen",
              "insertdatetime media table paste code help",
              "emoticons",
            ],
            contextmenu: "link useBrowserSpellcheck image table",
            setup: function (editor) {
              editor.ui.registry.addMenuItem("useBrowserSpellcheck", {
                text: `Use "${
                  isMacOs() ? "Control" : "Ctrl"
                } + Right click" to access spellchecker`,
                onAction: function () {
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
                update: function () {
                  return editor.selection.isCollapsed()
                    ? ["useBrowserSpellcheck"]
                    : [];
                },
              });
            },
          }}
          key={`editor_${props.isToolbarHidden}_${props.isDisabled}`}
          onEditorChange={handleEditorChange}
          toolbar={props.isToolbarHidden ? false : toolbarConfig}
          value={editorValue}
        />
      </RichTextEditorInputWrapper>
    </StyledRTEditor>
  );
}

export default RichtextEditorComponent;
