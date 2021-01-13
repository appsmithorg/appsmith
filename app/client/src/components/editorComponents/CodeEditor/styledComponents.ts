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
    padding: 0px 0px;
    font-size: 90%;
    font-family: monospace;
    max-height: 20em;
    overflow-y: auto;
    background: ${(props) =>
      props.editorTheme === EditorTheme.DARK ? "#090A0F" : "#ffffff"};
    border: 1px solid;
    border-color: ${(props) =>
      props.editorTheme === EditorTheme.DARK ? "#535B62" : "#EBEFF2"};
    box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
    border-radius: 1px;
  }

  .CodeMirror-hint {
    height: 25px;
    color: ${(props) =>
      props.editorTheme === EditorTheme.DARK ? "#F4F4F4" : "#1E242B"};
    cursor: pointer;
    display: flex;
    width: 250px;
    align-items: center;
    font-size: 13px;
  }

  .datasource-hint {
    padding: 5px;
    display: block;
    width: 500px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; 
  }

  li.CodeMirror-hint-active {
    background: ${(props) =>
      props.editorTheme === EditorTheme.DARK
        ? "rgba(244,244,244,0.2)"
        : "rgba(128,136,141,0.2)"};
    border-radius: 1px;
  }
  .CodeMirror-Tern-completion {
    padding-left: 22px !important;
    &:hover{
      background: ${(props) =>
        props.editorTheme === EditorTheme.DARK
          ? "rgba(244,244,244,0.2)"
          : "rgba(128,136,141,0.2)"};
    }
  }
  .CodeMirror-Tern-completion:before {
    left: 4px !important;
    bottom: 4px !important;
    line-height: 15px !important;
  }
  .CodeMirror-Tern-tooltip {
    z-index: 20 !important;
  }
  .CodeMirror-Tern-hint-doc {
    display: none;
    &.visible {
      display: block;
      background-color: ${(props) =>
        props.editorTheme === EditorTheme.DARK ? "#23292e" : "#fff"} !important;
      color: ${(props) =>
        props.editorTheme === EditorTheme.DARK
          ? "#F4F4F4"
          : "#1E242B"} !important;
      max-height: 150px;
      width: 250px;
      font-size: 12px;
      padding: 5px !important;
      border: 1px solid !important;
      border-color: ${(props) =>
        props.editorTheme === EditorTheme.DARK
          ? "#23292e"
          : "#DEDEDE"} !important;
      box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.12) !important;
      overflow: scroll;
    }

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

const editorBackground = (theme?: EditorTheme) => {
  let bg = "#FFFFFF";
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
}>`
  width: 100%;
  ${(props) =>
    props.size === EditorSize.COMPACT && props.isFocused
      ? `
  z-index: 5;
  position: absolute;
  right: 0;
  left: 0;
  top: 0;
  `
      : `position: relative;`}
  min-height: 32px;
  height: ${(props) => props.height || "auto"};
  background-color: ${(props) => editorBackground(props.editorTheme)};
  background-color: ${(props) => props.disabled && "#eef2f5"};
  ${(props) =>
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
  border: 0px;
  border-radius: 0px;
  &:hover {
    && {
      .cm-s-duotone-dark.CodeMirror {
        cursor: pointer;
        border-radius: 0px;
        background: ${(props) =>
          !props.isNotHover
            ? Colors.SHARK2
            : props.isFocused
            ? Colors.NERO
            : Colors.BALTIC_SEA};
      }
      .cm-s-duotone-light.CodeMirror {
        cursor: pointer;
        border-radius: 0px;
        background: ${(props) =>
          !props.isNotHover
            ? Colors.WHITE_SNOW
            : props.isFocused
            ? Colors.MERCURY
            : Colors.WHITE};
      }
    }
  }
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
      font-size: 12px;
      line-height: 16px;
      letter-spacing: -0.21px;
      border-radius: 0px;
      border-bottom: 1px solid ${Colors.MERCURY};
      padding-left: 10px;
      background: ${(props) =>
        props.isFocused ? Colors.MERCURY : Colors.WHITE};
      color: ${Colors.CHARCOAL};
      & {
        span.cm-operator {
          color: ${(props) => props.theme.colors.textDefault};
        }
      }
    }
    .cm-s-duotone-dark.CodeMirror {
      border-radius: 0px;
      padding-left: 10px;
      border-bottom: 1px solid ${Colors.NERO};
      font-size: 12px;
      line-height: 16px;
      letter-spacing: -0.21px;
      background: ${(props) =>
        props.isFocused ? Colors.NERO : Colors.BALTIC_SEA};
      color: ${Colors.LIGHT_GREY};
    }
    .binding-brackets {
      ${(props) =>
        props.hasError
          ? `
      color: ${props.theme.colors.error};
      `
          : `color: ${
              props.editorTheme === EditorTheme.DARK
                ? props.theme.colors.bindingTextDark
                : props.theme.colors.bindingText
            };`}
      font-weight: 700;
    }
    .CodeMirror-matchingbracket { 
      text-decoration: none; 
      color: #FFD600 !important;
      background-color: #A74444;
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
      padding: ${(props) => props.theme.spaces[3]}px 0px;
      background-color: ${(props) => props.disabled && "#eef2f5"};
      cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
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
  isError: boolean;
}>`
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
  border-color: ${(props) =>
    !props.isError && props.isActive && props.skin === Skin.DARK
      ? Colors.ALABASTER
      : "transparent"};
  > span:first-of-type {
    width: 30px;
    position: absolute;
    right: 0px;
  }
  &:hover {
    border-color: ${(props) =>
      !props.isError && props.skin === Skin.DARK
        ? Colors.ALABASTER
        : "transparent"};
    .lightning-menu {
      background: ${(props) => (!props.isNotHover ? "#716E6E" : "")};
      svg {
        path,
        circle {
          fill: ${(props) =>
            !props.isNotHover
              ? props.skin === Skin.DARK
                ? Colors.BLUE_CHARCOAL
                : Colors.WHITE
              : ""};
        }
      }
    }
  }
  border: 0px;
  border-radius: 0px;
  .lightning-menu {
    z-index: 1 !important;
  }
`;
