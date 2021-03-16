import { createGlobalStyle } from "styled-components";
import { Theme } from "constants/DefaultTheme";

export const AutocompleteStyles = createGlobalStyle<{
  theme: Theme;
}>`
  .CodeMirror-hints {
    position: absolute;
    z-index: 20;
    overflow: hidden;
    list-style: none;
    margin-top: ${(props) => props.theme.spaces[3]}px;
    padding: 0px 0px;
    font-size: 90%;
    font-family: monospace;
    max-height: 20em;
    overflow-y: auto;
    background: #FAFAFA;
    box-shadow: 0px 12px 28px -6px rgba(0, 0, 0, 0.32);
    border-radius: 0px;
  }

  .CodeMirror-hint {
    height: 24px;
    color: #090707;
    cursor: pointer;
    display: flex;
    width: 220px;
    align-items: center;
    font-size: 12px;
    line-height: 15px;
    letter-spacing: -0.24px;
    &:hover {
      background: #6A86CE
      border-radius: 0px;
      color: #fff;
      &:after {
        color: #fff;
      }
    }
  }

  .datasource-hint {
    padding: 10px;
    display: block;
    width: 500px;
    height: 32px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .CodeMirror-Tern-completion {
    padding-left: ${(props) => props.theme.spaces[11]}px !important;
    &:hover{
      background: #6A86CE;
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
    position: absolute;
    right: 8px;
    bottom: 6px;
    font-style: italic;
    font-weight: normal;
    font-size: 10px;
    line-height: 13px;
    letter-spacing: -0.24px;
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
  .CodeMirror-Tern-tooltip {
    z-index: 20 !important;
  }
  li.CodeMirror-hint-active {
    background: ${(props) =>
      props.theme.colors.codeMirror.background.hoverState};
    border-radius: 0px;
    color: #fff;
    &:after {
      color: #fff;
    }
  }
  .CodeMirror-Tern-hint-doc {
    display: none;
    &.visible {
      display: block;
      background-color: #fff !important;
      color: #1E242B !important;
      max-height: 150px;
      width: 250px;
      font-size: 12px;
      padding: 5px !important;
      border: 1px solid !important;
      border-color: #23292e !important;
      box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.12) !important;
      overflow: scroll;
    }

  }
`;
