import styled from "styled-components";
import type { CodeEditorBorder } from "components/editorComponents/CodeEditor/EditorConfig";

import {
  EditorSize,
  EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { CodeEditorColors } from "components/editorComponents/CodeEditor/constants";
import type { Theme } from "constants/DefaultTheme";
import { Skin } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { NAVIGATION_CLASSNAME } from "./MarkHelpers/entityMarker";

export const PEEK_STYLE_PERSIST_CLASS = "peek-style-persist";

const getBorderStyle = (
  props: { theme: Theme } & {
    editorTheme?: EditorTheme;
    hasError: boolean;
    size: EditorSize;
    isFocused: boolean;
    disabled?: boolean;
  },
) => {
  if (props.hasError) return "var(--ads-v2-color-border-error)";

  if (props.editorTheme !== EditorTheme.DARK) {
    if (props.isFocused) return "var(--ads-v2-color-border-emphasis)";

    return "var(--ads-v2-color-border)";
  }

  return "transparent";
};

export const EditorWrapper = styled.div<{
  editorTheme?: EditorTheme;
  hasError: boolean;
  isFocused: boolean;
  disabled?: boolean;
  size: EditorSize;
  height?: string | number;
  borderLess?: boolean;
  isNotHover?: boolean;
  isReadOnly?: boolean;
  isRawView?: boolean;
  border?: CodeEditorBorder;
  hoverInteraction?: boolean;
  fillUp?: boolean;
  className?: string;
  codeEditorVisibleOverflow?: boolean;
  ctrlPressed: boolean;
  removeHoverAndFocusStyle?: boolean;
  AIEnabled?: boolean;
  mode: string;
  maxHeight?: string | number;
  showFocusRing?: boolean;
}>`
  // Bottom border was getting clipped
  .CodeMirror.cm-s-duotone-light.CodeMirror-wrap {
    clip-path: none !important;
  }
  width: 100%;
  ${(props) =>
    (props.size === EditorSize.COMPACT ||
      props.size === EditorSize.COMPACT_RETAIN_FORMATTING) &&
    props.isFocused
      ? `
  z-index: 5;
  right: 0;
  left: 0;
  top: 0;
  `
      : `position: relative;`}
  min-height: 36px;
  max-height: ${(props) => props.maxHeight || "auto"};
  height: ${(props) => props.height || "auto"};
  background-color: ${(props) =>
    props.disabled ? "var(--ads-v2-color-bg-muted)" : "var(--ads-v2-color-bg)"};
  border-color: ${getBorderStyle};
  display: flex;
  flex: 1;
  flex-direction: row;
  text-transform: none;

  && {
    ${(props) =>
      props.showFocusRing &&
      `
        .CodeMirror-focused {
          outline: var(--ads-v2-border-width-outline) solid
            var(--ads-v2-color-outline) !important;
          outline-offset: var(--ads-v2-offset-outline) !important;
          z-index: 1;
        }
      `}

    .CodeMirror-cursor {
      border-right: none;
      border-left-width: 2px;
      border-left-color: ${(props) =>
        props.editorTheme === EditorTheme.DARK
          ? props.theme.colors.textOnDarkBG
          : props.theme.colors.textDefault} !important;
    }
    .cm-s-duotone-light.CodeMirror {
      border-radius: var(--ads-v2-border-radius);
      /* ${(props) =>
        props.isFocused &&
        `outline: ${
          props?.removeHoverAndFocusStyle
            ? "none"
            : "var(--ads-v2-border-width-outline) solid var(--ads-v2-color-outline)"
        };
        outline-offset: var(--ads-v2-offset-outline);
        clip-path: unset !important;
        `} */
      ${(props) => props.isFocused && `clip-path: unset !important;`}
      font-family: ${(props) => props.theme.fonts.code};
      font-size: ${(props) => (props.isReadOnly ? "12px" : "13px")};
      border: 1px solid
        ${(props) => {
          switch (true) {
            case props.border === "none":
              return "transparent";
            case props.border === "bottom-side":
              return "var(--ads-v2-color-border)";
            case props.hasError:
              return "var(--ads-v2-color-border-error)";

            case props.isFocused:
              return "var(--ads-v2-color-border-emphasis-plus) !important";
            default:
              return "var(--ads-v2-color-border)";
          }
        }};
      ${(props) => props.borderLess && "border: none;"}

      background: var(--ads-v2-color-bg);
      color: var(--ads-v2-color-fg);
      & {
        span.cm-operator {
          color: ${CodeEditorColors.OPERATOR};
        }
      }
      .cm-property {
        color: ${CodeEditorColors.PROPERTY};
      }
      .cm-keyword {
        color: ${CodeEditorColors.KEYWORD};
      }

      .cm-comment {
        color: ${CodeEditorColors.COMMENT};
      }

      .CodeMirror-foldgutter {
        width: 0.9em;
      }

      /* gutter arrow to collapse or expand code */
      .CodeMirror-guttermarker-subtle {
        color: #442334 !important;
        &:after {
          font-size: 14px;
          position: absolute;
          right: 4px;
        }
      }

      /* Text selection */
      div.CodeMirror-selected {
        background: #dbeafe !important;
      }
      .cm-string,
      .token.string {
        color: ${CodeEditorColors.STRING};
      }

      /* json response in the debugger */
      .cm-string.cm-property {
        color: ${CodeEditorColors.PROPERTY};
      }

      // /* +, =>, -, etc. operators */
      // span.cm-operator {
      //   color: #009595;
      // }A

      /* function arguments */
      .cm-def {
        color: #364252; /* This is gray-7 from our new shades of gray */
      }

      /* variable declarations */
      .cm-keyword + span + .cm-def {
        color: #364252;
      }

      /* function arguments */
      .cm-def,
      .cm-property + span + .cm-def,
      .cm-def + span + .cm-def {
        color: ${CodeEditorColors.FUNCTION_ARGS};
      }

      .cm-atom + span + .cm-property,

      /* object keys, object methods */
      .cm-keyword + span + .cm-property,
      .cm-variable + span + .cm-property,
      .cm-property + span + .cm-property,
      .cm-number + span + .cm-property,
      .cm-string + span + .cm-property,
      .cm-operator + span + .cm-property {
        color: hsl(30, 77%, 40%);
      }

      span.cm-number {
        color: ${CodeEditorColors.NUMBER};
      }

      .cm-s-duotone-light span.cm-variable-2,
      .cm-s-duotone-light span.cm-variable-3 {
        color: #364252;
      }

      .cm-positive,
      .cm-string-2,
      .cm-type,
      .cm-url {
        color: #364252;
      }

      .cm-binding-brackets,
      .CodeMirror-matchingbracket {
        font-weight: 400;
      }

      .navigable-entity-highlight:hover {
        background-color: #ededed !important;
        font-weight: 600;
      }

      .cm-binding-brackets {
        // letter-spacing: -1.8px;
        color: hsl(222, 70%, 77%);
      }

      /* some sql fixes */
      .cm-m-sql.cm-keyword {
        font-weight: 400;
      }

      .CodeMirror-activeline-background {
        background-color: #ececec;
      }
    }
    .CodeMirror-guttermarker-subtle {
      color: var(--ads-v2-color-fg-subtle);
    }
    .cm-s-duotone-light .CodeMirror-gutters {
      background: var(--ads-v2-color-bg-subtle);
    }
    .cm-s-duotone-light .CodeMirror-linenumber,
    .cm-binding-brackets {
      color: ${(props) =>
        props.editorTheme === EditorTheme.DARK
          ? props.theme.colors.bindingTextDark
          : props.theme.colors.bindingText};
      font-weight: 700;
    }

    .${PEEK_STYLE_PERSIST_CLASS} {
      border-color: var(--ads-v2-color-border-emphasis);
      background-color: #ededed;
    }

    .${NAVIGATION_CLASSNAME} {
      cursor: ${(props) => (props.ctrlPressed ? "pointer" : "selection")};
      ${(props) =>
        props.ctrlPressed &&
        `&:hover {
        text-decoration: underline;
        background-color:	#ededed;
      }`}
    }

    .CodeMirror-matchingbracket {
      text-decoration: none;
      color: #ffd600 !important;
      background-color: #a74444;
    }
    .datasource-highlight {
      background: ${(props) =>
        props.editorTheme === EditorTheme.DARK ? "#002B54" : "#e7f3ff"};
      border: 1px solid
        ${(props) =>
          props.editorTheme === EditorTheme.DARK ? "#10569A" : "#69b5ff"};
      padding: 2px;
      border-radius: 2px;
      margin-right: 2px;
    }
    .datasource-highlight-error {
      background: var(--ads-v2-color-bg-error);
      border: 1px solid var(--ads-v2-color-border-error);
    }
    .datasource-highlight-success {
      background: var(--ads-v2-color-bg-success);
      border: 1px solid var(--ads-v2-color-border-success);
    }
    .CodeMirror {
      flex: 1;
      line-height: 21px;
      z-index: 0;
      border-radius: 4px;
      height: auto;
    }
    ${(props) =>
      props.disabled &&
      `
    .CodeMirror-cursor {
      display: none !important;
    }
    `}
    .CodeMirror pre.CodeMirror-placeholder {
      color: var(--ads-v2-color-fg-subtle);
    }
    ${(props) =>
      (props.size === EditorSize.COMPACT ||
        props.size === EditorSize.COMPACT_RETAIN_FORMATTING) &&
      `
      .CodeMirror-hscrollbar {
      -ms-overflow-style: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
    `}
  }
  && {
    .CodeMirror-lines {
      padding: ${(props) => props.theme.spaces[2]}px 0px;
      opacity: ${(props) => props.disabled && "var(--ads-v2-opacity-disabled)"};
      cursor: ${(props) => (props.disabled ? "not-allowed" : "text")};
      pre.CodeMirror-line,
      pre.CodeMirror-line-like {
        padding: 0 ${(props) => props.theme.spaces[2]}px;
      }
    }
  }

  pre.CodeMirror-line,
  pre.CodeMirror-line-like {
    padding: 0 ${(props) => props.theme.spaces[3]}px;
  }

  ${(props) =>
    props.className === "js-editor" &&
    `
    overflow: hidden;
    .cm-tab {
      border-right: 1px dotted #ccc;
    }
    height: 100%;
  `}

  .bp3-popover-target {
    padding-right: 10px;
    padding-top: 5px;
  }
  .leftImageStyles {
    width: 20px;
    height: 20px;
    margin: 5px;
  }
  .linkStyles {
    margin: 5px;
    margin-right: 11px;
  }
  .CodeMirror-foldmarker {
    color: inherit;
    text-shadow: none;
    font: inherit;
  }

  ${(props) =>
    props.isReadOnly &&
    `
  &&&&&&&& .CodeMirror-scroll {
    width: 100%;
  }
  `}

  .CodeEditorTarget {
    width: 100%;

    &:hover {
      .CodeMirror.cm-s-duotone-light {
        border-color: ${(props) =>
          props.borderLess ? "none" : "var(--ads-v2-color-border-emphasis)"};
      }
    }

    &:focus-visible {
      .CodeMirror.cm-s-duotone-light {
        outline: var(--ads-v2-border-width-outline) solid
          var(--ads-v2-color-outline);
        outline-offset: var(--ads-v2-offset-outline);
      }
    }

    ${(props) =>
      props.size === EditorSize.COMPACT ||
      props.size === EditorSize.COMPACT_RETAIN_FORMATTING
        ? `
        position: absolute;
        left: 0;
        right: 0;
      `
        : `
          position: relative;
        `}
    ${(props) => (props.isFocused ? `z-index: 3;` : `z-index: 0;`)}

    ${(props) => {
      let height = props.height || "auto";

      if (
        (props.size === EditorSize.COMPACT ||
          props.size === EditorSize.COMPACT_RETAIN_FORMATTING) &&
        !props.isFocused
      ) {
        height = props.height || "36px";
      }

      return `height: ${height}`;
    }}
  }

  ${(props) =>
    props.codeEditorVisibleOverflow &&
    `
    &&&&&&&& .CodeMirror-scroll {
      overflow: visible;
    }

    & .CodeEditorTarget {
      height: ${props.isFocused ? "auto" : "36px"};
    }
  `}

  ${(props) =>
    props.isReadOnly &&
    `
      &&&&&&&&&& .cm-m-javascript.cm-number {
        color: ${props.isRawView ? "#000" : "#268bd2"};

      }
      &&&&&&&& .cm-m-javascript.cm-string.cm-property {
        color: ${props.isRawView ? "#000" : "#002b36"};
      }

      &&&&&&&& .cm-m-javascript.cm-string {
        color: ${props.isRawView ? "#000" : "#cb4b16"};
      }
    `}
`;

export const IconContainer = styled.div`
  border-radius: 4px 0 0 4px;
  margin: 0;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #eef2f5;
  svg {
    height: 20px;
    width: 20px;
    path {
      fill: #979797;
    }
  }
`;

export const DynamicAutocompleteInputWrapper = styled.div<{
  skin: Skin;
  theme: Theme;
  isActive: boolean;
  isNotHover: boolean;
  isError: boolean;
}>`
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
  > span:first-of-type {
    width: 30px;
    position: absolute;
    right: 0;
  }
  &:hover {
    .lightning-menu {
      background: ${(props) => (!props.isNotHover ? "#090707" : "")};
      svg {
        path,
        circle {
          fill: ${(props) =>
            !props.isNotHover
              ? props.skin === Skin.DARK
                ? Colors.BLUE_CHARCOAL
                : Colors.ALTO2
              : ""};
        }
      }
    }
    button {
      visibility: visible;
    }
  }
  border-radius: var(--ads-v2-border-radius);
  .ur--has-border {
    border-radius: var(--ads-v2-border-radius);
  }
  .lightning-menu {
    z-index: 1 !important;
  }
`;
