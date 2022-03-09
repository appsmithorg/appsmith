import { createGlobalStyle } from "styled-components";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import { LINT_TOOLTIP_JUSTIFIFIED_LEFT_CLASS } from "components/editorComponents/CodeEditor/constants";

export const CodemirrorHintStyles = createGlobalStyle<{
  editorTheme: EditorTheme;
  theme: Theme;
}>`
  .CodeMirror-hints {
    position: absolute;
    z-index: 20;
    overflow: hidden;
    list-style: none;
    margin-top: ${(props) => props.theme.spaces[3]}px;
    padding: 0px 0px;
    font-family: monospace;
    max-height: 20em;
    overflow-y: auto;
    background: ${(props) =>
      props.editorTheme === EditorTheme.LIGHT ? "#fafafa" : "#262626"};
    box-shadow: 0px 0px 2px 2px #ebebeb;
    border-radius: 1px;
  }

  .CodeMirror-hint {
    height: 24px;
    color: ${(props) =>
      props.editorTheme === EditorTheme.LIGHT ? "#090707" : "#FFFFFF"};
    cursor: pointer;
    display: flex;
    min-width: 220px;
    width: auto;
    align-items: center;
    font-size: 12px;
    line-height: 15px;
    letter-spacing: -0.24px;
    &:hover {
      background: ${(props) =>
        props.editorTheme === EditorTheme.LIGHT ? "#E8E8E8" : "#157A96"};
      border-radius: 0px;
      color: #090707;
      &:after {
        color: #090707;
      }
    }
  }

  .CodeMirror-command-header {
    padding: 0 ${(props) => props.theme.spaces[3]}px;
    color: #716e6e;
    pointer-events: none !important;
    font-family: ${(props) => props.theme.fonts.text};
    ${(props) => getTypographyByKey(props, "p3")}
    font-weight: 600;
  }

  .CodeMirror-commands {
    color: #4b4848;
    position: relative;
    padding: 0 ${(props) => props.theme.spaces[3]}px !important;
    height: 25px;
    font-family: ${(props) => props.theme.fonts.text};
    ${(props) => getTypographyByKey(props, "p3")}
    &.CodeMirror-hint-active {
      .shortcut {
        color: #ffffff;
      }
      .add-datasource-icon {
        background: white;
      }
    }
    .command-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding:5px 0;
      flex: 1;
    }
    .command {
      display: flex;
      align-items: center;
      > div {
        padding: 0 2px;
        img {
          height: 14px;
          width: 14px;
        }
      }
    }
    .shortcut {
      font-style: italic;
      font-size: 10px;
      color: #a9a7a7;
    }
  }

  .CodeMirror-hint-header {
    padding-left: 8px;
    color: #4B4848;
    pointer-events: none !important;
    font-weight: 600;
  }

  .datasource-hint {
    padding: 10px 20px 10px 10px !important;
    display: block;
    width: 500px;
    height: 32px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #FAFAFA;
    color: black;
    &.custom {
      height: unset;
      background: #ebebeb;
      width: 600px;
      &:hover{
        background: #ffffff;
        color: black;
      }
      &.CodeMirror-hint-active {
        background: #ffffff;
      }
    }

    &.invalid {
      color: ${(props) => props.theme.colors.errorMessage};
    }
  }
  .CodeMirror-Tern-completion {
    display: flex;
    padding-left: ${(props) => props.theme.spaces[11]}px !important;
    &:hover{
      background: ${(props) =>
        props.editorTheme === EditorTheme.LIGHT ? "#E8E8E8" : "#157A96"};
      color: #090707;
      &:after {
        color: #090707;
      }
    }
  }
  .CodeMirror-Tern-completion:before {
    left: 7px;
    bottom: 6px;
    height: 12px;
    width: 12px;
    border-radius: 0;
    font-size: 10px;
    line-height: 12px;
    font-weight: normal;
    text-align: center;
    color: ${(props) => props.theme.colors.codeMirror.dataType.shortForm};
    margin-right: ${(props) => props.theme.spaces[13]}px;
  }
  .CodeMirror-Tern-completion-fn:before {
    background: ${(props) => props.theme.colors.dataTypeBg.function};
  }
  .CodeMirror-Tern-completion-object:before {
    background: ${(props) => props.theme.colors.dataTypeBg.object};
  }
  .CodeMirror-Tern-completion-unknown:before {
    background: ${(props) => props.theme.colors.dataTypeBg.unknown};
  }
  .CodeMirror-Tern-completion-array:before {
    background: ${(props) => props.theme.colors.dataTypeBg.array};
  }
  .CodeMirror-Tern-completion-number:before, .CodeMirror-Tern-completion-string:before, .CodeMirror-Tern-completion-bool:before {
    background: ${(props) => props.theme.colors.dataTypeBg.number};
  }
  .CodeMirror-Tern-completion:after {
    display: flex;
    justify-content: flex-end;
    flex: 1;
    padding-right: 10px;
    font-style: italic;
    font-weight: normal;
    font-size: 10px;
    line-height: 13px;
    letter-spacing: -0.24px;
    padding-left: 10px;
    color: ${(props) => props.theme.colors.codeMirror.dataType.fullForm};
  }
  .CodeMirror-Tern-completion-fn:after {
    content: "Function";
  }
  .CodeMirror-Tern-completion-object:after {
    content: "Object";
  }
  .CodeMirror-Tern-completion-unknown:after {
    content: "Unknown";
  }
  .CodeMirror-Tern-completion-array:after {
    content: "Array";
  }
  .CodeMirror-Tern-completion-number:after {
    content: "Number";
  }
  .CodeMirror-Tern-completion-string:after {
    content: "String";
  }
  .CodeMirror-Tern-completion-bool:after {
    content: "Boolean";
  }
  .CodeMirror-Tern-completion-keyword:before {
    content: "K";
    background: ${(props) => props.theme.colors.dataTypeBg.object};
  }
  .CodeMirror-Tern-completion-keyword[keyword]:after {
    content: attr(keyword);
  }
  .CodeMirror-Tern-tooltip {
    z-index: 20 !important;
  }
  li.CodeMirror-hint-active {
    background: #6A86CE;
    border-radius: 0px;
    color: #fff;
    &:after {
      color: #fff;
    }
    &:hover {
      background: #6A86CE;
      color: #fff;
      &:after {
        color: #fff;
      }
    }
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
  .CodeMirror-lint-tooltip {
    border: none;
    background: ${(props) =>
      props.editorTheme === EditorTheme.DARK ? "#23292e" : "#fff"};
    box-shadow: 0px 12px 28px -6px rgba(0, 0, 0, 0.32);
    padding: 7px 12px;
    border-radius: 0;
    
    &.${LINT_TOOLTIP_JUSTIFIFIED_LEFT_CLASS}{
    transform: translate(-100%);
  }
  
  }
  .CodeMirror-lint-message {
    margin-top: 5px;
    margin-bottom: 5px;
    font-family: ${(props) => props.theme.fonts.text};
    color: #4B4848;
  }
  .CodeMirror-lint-mark-warning{
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAB1JREFUGFdjZICC/3sY/jO6MDAygvgwDpiGcWAqASvpC745SEL8AAAAAElFTkSuQmCC");
  }
`;
