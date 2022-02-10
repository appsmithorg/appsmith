import styled from "styled-components";
import {
  CodeEditorBorder,
  EditorSize,
  EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { Skin, Theme } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";

const getBorderStyle = (
  props: { theme: Theme } & {
    editorTheme?: EditorTheme;
    hasError: boolean;
    size: EditorSize;
    isFocused: boolean;
    disabled?: boolean;
  },
) => {
  if (props.hasError) return props.theme.colors.error;
  if (props.editorTheme !== EditorTheme.DARK) {
    if (props.isFocused) return props.theme.colors.inputActiveBorder;
    return props.theme.colors.border;
  }
  return "transparent";
};

const editorBackground = (theme?: EditorTheme) => {
  let bg = "#FAFAFA";
  switch (theme) {
    case EditorTheme.DARK:
      bg = "#1A191C";
      break;
    case EditorTheme.LIGHT:
      bg = "#FAFAFA";
      break;
  }
  return bg;
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
  border?: CodeEditorBorder;
  hoverInteraction?: boolean;
  fill?: boolean;
  className?: string;
  codeEditorVisibleOverflow?: boolean;
}>`
  width: 100%;
  ${(props) =>
    props.size === EditorSize.COMPACT && props.isFocused
      ? `
  z-index: 5;
  right: 0;
  left: 0;
  top: 0;
  `
      : `position: relative;`}
  min-height: 38px;
  height: ${(props) => props.height || "auto"};
  background-color: ${(props) => editorBackground(props.editorTheme)};
  background-color: ${(props) => props.disabled && "#eef2f5"};
  border-color: ${getBorderStyle};
  display: flex;
  flex: 1;
  flex-direction: row;
  text-transform: none;
  ${(props) =>
    props.hoverInteraction
      ? `
  &:hover {
    && {
      .cm-s-duotone-dark.CodeMirror {
        cursor: pointer;
        border-radius: 0px;
        background: ${
          !props.isNotHover
            ? Colors.SHARK2
            : props.isFocused
            ? Colors.NERO
            : Colors.BALTIC_SEA
        };
      }
      .cm-s-duotone-light.CodeMirror {
        cursor: pointer;
        border-radius: 0px;
        background: ${Colors.GREY_1};
      }
    }
  }`
      : null};
  && {
    .CodeMirror-cursor {
      border-right: none;
      border-left-width: 2px;
      border-left-color: ${(props) =>
        props.editorTheme === EditorTheme.DARK
          ? props.theme.colors.textOnDarkBG
          : props.theme.colors.textDefault} !important;
    }
    .cm-s-duotone-light.CodeMirror {
      padding: 0 6px;
      border-radius: 0px;
      border: 1px solid ${(props) => {
        switch (true) {
          case props.border === "none":
            return "transparent";
          case props.border === "bottom-side":
            return Colors.MERCURY;
          case props.hasError:
            return "red";
          case props.isFocused:
            return "var(--appsmith-input-focus-border-color)";
          default:
            return Colors.GREY_5;
        }
      }};
      background: ${(props) => props.theme.colors.apiPane.bg};
      color: ${Colors.CHARCOAL};
      & {
        span.cm-operator {
          color: ${(props) => props.theme.colors.textDefault};
        }
      }
    }
    .cm-s-duotone-light .CodeMirror-gutters {
      background: ${Colors.Gallery};
    }
    .cm-s-duotone-dark.CodeMirror {
      border-radius: 0px;
      ${(props) =>
        props.border === "none"
          ? `border: 0px`
          : props.border === "bottom-side"
          ? `border-bottom: 1px solid ${Colors.NERO}`
          : `border: 1px solid ${Colors.NERO}`};
      background: ${(props) =>
        props.isFocused || props.fill ? Colors.NERO : "#262626"};
      color: ${Colors.LIGHT_GREY};
    }
    .cm-s-duotone-light .CodeMirror-linenumber,
    .cm-s-duotone-dark .CodeMirror-linenumber {
      color: ${Colors.DOVE_GRAY};
    }
    .cm-s-duotone-dark .CodeMirror-gutters {
      background: ${Colors.SHARK2};
    }
    .binding-brackets {
      color: ${(props) =>
        props.editorTheme === EditorTheme.DARK
          ? props.theme.colors.bindingTextDark
          : props.theme.colors.bindingText};
      font-weight: 700;
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
      background: #FFF0F0;
      border: 1px solid #F22B2B;
    }
    .datasource-highlight-success {
      background: #E3FFF3;
      border: 1px solid #03B365;
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
      color: ${(props) =>
        props.theme.colors.apiPane.codeEditor.placeholderColor};
    }
    ${(props) =>
      props.size === EditorSize.COMPACT &&
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
      background-color: ${(props) => props.disabled && "#eef2f5"};
      cursor: ${(props) => (props.disabled ? "not-allowed" : "text")};
    }
  }
  ${(props) =>
    props.className === "js-editor" &&
    `
    overflow: hidden;
    .cm-tab {
      border-right: 1px dotted #ccc;
    }
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
  .CodeEditorTarget {
    width: 100%;

    &:focus {
      border: 1px solid var(--appsmith-input-focus-border-color);
      .CodeMirror.cm-s-duotone-light {
        border: none;
      }
    }

    ${(props) =>
      props.size === EditorSize.COMPACT
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
      if (props.size === EditorSize.COMPACT && !props.isFocused) {
        height = props.height || "38px";
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
      height: ${props.isFocused ? "auto" : "35px"};
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
    right: 0px;
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
    .commands-button {
      display: flex;
    }
  }
  border-radius: 0px;
  .lightning-menu {
    z-index: 1 !important;
  }
  .commands-button {
    z-index: 2;
    width: 20px;
    position: absolute;
    right: 5px;
    top: 7px;
    height: 20px;
    background: transparent;
    display: none;
    color: #f86a2b;
    border: none;
    font-weight: bold;
    font-size: 14px;
    font-style: italic;
    padding: 0 0 3px;
    margin: 0 !important;
    &:hover {
      background: #f86a2b;
      color: white;
    }
  }
`;
