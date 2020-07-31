import styled, { createGlobalStyle } from "styled-components";
import {
  EditorSize,
  EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { Skin, Theme } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";

export const HintStyles = createGlobalStyle<{ editorTheme: EditorTheme }>`
  .CodeMirror-hints {
    position: absolute;
    z-index: 20;
    overflow: hidden;
    list-style: none;
    margin: 0;
    padding: 5px;
    font-size: 90%;
    font-family: monospace;
    max-height: 20em;
    width: 300px;
    overflow-y: auto;
    background: ${props =>
      props.editorTheme === EditorTheme.DARK ? "#090A0F" : "#ffffff"};
    border: 1px solid;
    border-color: ${props =>
      props.editorTheme === EditorTheme.DARK ? "#535B62" : "#EBEFF2"}
    box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
    border-radius: 4px;
  }

  .CodeMirror-hint {
    height: 32px;
    padding: 3px;
    margin: 0;
    white-space: pre;
    color: ${props =>
      props.editorTheme === EditorTheme.DARK ? "#F4F4F4" : "#1E242B"};
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
  }

  li.CodeMirror-hint-active {
    background: ${props =>
      props.editorTheme === EditorTheme.DARK
        ? "rgba(244,244,244,0.1)"
        : "rgba(128,136,141,0.1)"};
    border-radius: 4px;
  }
  .CodeMirror-Tern-completion {
    padding-left: 22px !important;
  }
  .CodeMirror-Tern-completion:before {
    left: 4px !important;
    bottom: 7px !important;
    line-height: 15px !important;
  }
  .CodeMirror-Tern-tooltip {
    z-index: 20 !important;
  }
  .CodeMirror-Tern-hint-doc {
    background-color: ${props =>
      props.editorTheme === EditorTheme.DARK ? "#23292e" : "#fff"} !important;
    color: ${props =>
      props.editorTheme === EditorTheme.DARK
        ? "#F4F4F4"
        : "#1E242B"} !important;
    max-height: 150px;
    width: 250px;
    padding: 12px !important;
    border: 1px solid !important;
    border-color: ${props =>
      props.editorTheme === EditorTheme.DARK
        ? "#23292e"
        : "#DEDEDE"} !important;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.12) !important;
    overflow: scroll;
  }
`;

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

export const EditorWrapper = styled.div<{
  editorTheme?: EditorTheme;
  hasError: boolean;
  isFocused: boolean;
  disabled?: boolean;
  size: EditorSize;
  height?: string | number;
  borderLess?: boolean;
}>`
  width: 100%;
  ${props =>
    props.size === EditorSize.COMPACT && props.isFocused
      ? `
  z-index: 5;
  position: absolute;
  right: 0;
  left: 0;
  top: 0;
  `
      : `z-index: 0; position: relative;`}
  min-height: 32px;
  height: ${props => props.height || "auto"};
  background-color: ${props =>
    props.editorTheme === EditorTheme.DARK ? "#272822" : "#fff"};
  background-color: ${props => props.disabled && "#eef2f5"};
  ${props =>
    !props.borderLess &&
    `
    border: 1px solid;
    border-radius: 4px;
  `}
  border-color: ${getBorderStyle};
  display: flex;
  flex: 1;
  flex-direction: row;
  text-transform: none;
  && {
    .CodeMirror-cursor {
      border-right: none;
      border-left-color: ${props =>
        props.editorTheme === EditorTheme.DARK
          ? props.theme.colors.textOnDarkBG
          : props.theme.colors.textDefault} !important
    }
    .cm-s-duotone-light.CodeMirror {
      background: #ffffff;
      color: #000000 !important;
      & {
        span.cm-operator {
          color: ${props => props.theme.colors.textDefault};
        }
      }
     }
    .cm-s-duotone-dark.CodeMirror {
      background: #182026;
      color: #FFFFFF;
    }
    .binding-brackets {
      color: ${props =>
        props.editorTheme === EditorTheme.DARK
          ? props.theme.colors.bindingTextDark
          : props.theme.colors.bindingText};
      font-weight: 700;
    }
    .datasource-highlight {
      background-color: rgba(104, 113, 239, 0.1);
      border: 1px solid rgba(104, 113, 239, 0.5);
      padding: 2px;
      border-radius: 2px;
      margin-right: 2px;
    }
    .CodeMirror {
      flex: 1;
      line-height: 21px;
      z-index: 0;
      border-radius: 4px;
      height: auto;
    }
    ${props =>
      props.disabled &&
      `
    .CodeMirror-cursor {
      display: none !important;
    }
    `}
    .CodeMirror pre.CodeMirror-placeholder {
      color: #a3b3bf;
    }
    ${props =>
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
      background-color: ${props => props.disabled && "#eef2f5"};
      cursor: ${props => (props.disabled ? "not-allowed" : "text")};
    }
  }
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
}>`
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
  border: ${props => (props.skin === Skin.DARK ? "1px solid" : "none")};
  border-radius: 2px;
  border-color: ${props =>
    props.isActive && props.skin === Skin.DARK
      ? Colors.ALABASTER
      : "transparent"};
  > span:first-of-type {
    width: 30px;
    position: absolute;
    right: 0px;
  }
  &:hover {
    border: ${props =>
      props.skin === Skin.DARK ? "1px solid " + Colors.ALABASTER : "none"};
    .lightning-menu {
      background: ${props =>
        !props.isNotHover
          ? props.skin === Skin.DARK
            ? Colors.ALABASTER
            : Colors.BLUE_CHARCOAL
          : ""};
      svg {
        path,
        circle {
          fill: ${props =>
            !props.isNotHover
              ? props.skin === Skin.DARK
                ? Colors.BLUE_CHARCOAL
                : Colors.WHITE
              : ""};
        }
      }
    }
  }
`;
