import { createGlobalStyle } from "styled-components";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { Theme } from "constants/DefaultTheme";
import { LINT_TOOLTIP_JUSTIFIED_LEFT_CLASS } from "components/editorComponents/CodeEditor/constants";

export const CodemirrorHintStyles = createGlobalStyle<{
  editorTheme: EditorTheme;
  theme: Theme;
}>`
  // Increase the specificity of hint styles to override the default ones
  .CodeMirror-hints {
    && {
      position: absolute;
      z-index: 20;
      overflow: hidden;
      list-style: none;
      margin-top: ${(props) => props.theme.spaces[3]}px;
      padding: 0px 0px;
      font-family: monospace;
      max-height: 25em;
      overflow-y: auto;
      background: var(--ads-v2-color-bg);
      box-shadow: var(--ads-v2-shadow-popovers);
      border: 1px solid var(--ads-v2-color-border);
      border-radius: var(--ads-v2-border-radius);
    }

    .CodeMirror-hint {
      height: 24px;
      color: var(--ads-v2-color-fg);
      cursor: pointer;
      display: flex;
      min-width: 220px;
      width: auto;
      align-items: center;
      font-size: 12px;
      line-height: 15px;
      letter-spacing: -0.24px;
      &:hover {
        background: var(--ads-v2-color-bg-subtle);
        border-radius: 0px;
        color: var(--ads-v2-color-fg);
        &:after {
          color: var(--ads-v2-color-fg);
        }
      }
    }

    .CodeMirror-command-header {
      padding: 0 12px;
      color: var(--ads-v2-color-fg);
      pointer-events: none !important;
      font-family: ${(props) => props.theme.fonts.text};
      font-size:12px;
      position: relative;
      height: 30px;
      marign: 0 4px;
      &:after {
        content: "";
        position: absolute;
        top: 0;
        left: 4px;
        right: 4px;
        width: calc(100% - 8px);
        height: 1px;
        background: var(--ads-v2-color-border);
      }
    }

    .CodeMirror-commands {
      &:first-child {
        margin-top: 4px
      }
      &:last-child {
        margin-bottom: 4px
      }
      color: var(--ads-v2-color-fg);
      position: relative;
      padding: 4px !important;
      height: auto;
      font-family: ${(props) => props.theme.fonts.text};
      font-size:14px;
      margin: 0 4px;
      &:hover {
        border-radius: var(--ads-v2-border-radius);
      }
      &.CodeMirror-hint-active {
        .magic {
          path {
            fill: black;
          }
        }
        .add-datasource-icon {
          background: var(--ads-v2-color-bg);
        }
        .command-container {
          .command-desc {
            display: flex;
          }
        }
      }
      .command-container {
        display: flex;
        align-items: start;
        flex-direction: column;
        gap: 4px;
        justify-content: space-between;
        flex: 1;
        padding: 6px;
        .command-desc {
          display: none;
          font-size: 12px;
          color: #6A7585;
        }
      }
      .command {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .CodeMirror-hint-header {
      padding: 8px;
      color: var(--ads-v2-color-fg);
      pointer-events: none !important;
    }

    .datasource-hint {
      padding: 10px 20px 10px 10px !important;
      display: block;
      width: 500px;
      height: 32px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      background: var(--ads-v2-color-bg);
      color: var(--ads-v2-color-fg);
      &.custom {
        height: unset;
        background-color: var(--ads-v2-color-bg);
        width: 600px;
        &:hover {
          background-color: var(--ads-v2-color-bg-subtle);
          color: var(--ads-v2-color-fg);
        }
        &.CodeMirror-hint-active {
          background-color: var(--ads-v2-color-bg-muted);
        }
      }

      &.invalid {
        color: var(--ads-v2-color-fg-error);
      }
    }
    .CodeMirror-Tern-completion {
      font-family: ${(props) => props.theme.fonts.code};
      display: flex;
      padding-left: ${(props) => props.theme.spaces[11]}px !important;
      &:hover{
        background: var(--ads-v2-color-bg-subtle);
        color: var(--ads-v2-color-fg);
        &:after {
          color: var(--ads-v2-color-fg);
        }
      }
    }
    .CodeMirror-Tern-completion:before {
      left: 7px;
      bottom: 6px;
      height: 12px;
      width: 12px;
      border-radius: var(--ads-v2-border-radius);
      font-size: 10px;
      line-height: 12px;
      font-weight: normal;
      text-align: center;
      color: var(--ads-v2-color-fg);
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
      background-color: var(--ads-v2-color-bg-muted);
      border-radius: var(--ads-v2-border-radius);
      color: var(--ads-v2-color-fg);
      &:after {
        color: var(--ads-v2-color-fg);
      }
      &:hover {
        background-color: var(--ads-v2-color-bg-muted);
        color: var(--ads-v2-color-fg);
        &:after {
          color: var(--ads-v2-color-fg);
        }
      }
    }
  }

  .cm-sql-hint{
    font-family: ${(props) => props.theme.fonts.code};
    display: flex;
    padding-left: ${(props) => props.theme.spaces[11]}px !important;
    &:hover{
      background: var(--ads-v2-color-bg-subtle);
      color: var(--ads-v2-color-fg);
      &:after {
        color: var(--ads-v2-color-fg);
      }
    }
    position: relative;
  }
  .cm-sql-hint:before {
    content: attr(icontext);
    left: 7px;
    bottom: 6px;
    height: 12px;
    width: 12px;
    border-radius: var(--ads-v2-border-radius);
    font-size: 10px;
    line-height: 12px;
    font-weight: normal;
    text-align: center;
    color: var(--ads-v2-color-fg);
    margin-right: ${(props) => props.theme.spaces[13]}px;
    position:absolute;
  }
  .cm-sql-hint:after{
    content: attr(hinttype);
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
  .cm-sql-hint-unknown:before {
    background:${(props) => props.theme.colors.dataTypeBg.unknown};
  }
  .cm-sql-hint-keyword:before {
    background:${(props) => props.theme.colors.dataTypeBg.object};
  }
  .cm-sql-hint-text:before {
    background:${(props) => props.theme.colors.dataTypeBg.number};
  }
  .cm-sql-hint-int4:before {
    background:${(props) => props.theme.colors.dataTypeBg.array};
  }
  .cm-sql-hint-table:before {
    background:${(props) => props.theme.colors.dataTypeBg.function};
  }
}

  .CodeMirror-Tern-hint-doc {
    display: none;
    &.visible {
      display: block;
        background-color: var(--ads-v2-color-bg) !important;
        color: var(--ads-v2-color-fg) !important;
        max-height: 150px;
        width: 250px;
        font-size: 12px;
        padding: 5px !important;
        border: 1px solid !important;
        border: 1px solid var(--ads-v2-color-border) !important;
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.12) !important;
        overflow: scroll;
    }
  }
  .CodeMirror-lint-tooltip {
    && {
      border: 1px solid var(--ads-v2-color-border) !important;
      border-radius: var(--ads-v2-border-radius);
      background: var(--ads-v2-color-bg) !important;
      box-shadow: 0px 12px 28px -6px rgba(0, 0, 0, 0.32);
      padding: 7px 12px;
      color: var(--ads-v2-color-fg);

      display: flex;
      align-items: center;
      gap: var(--ads-v2-spaces-3);

      &.${LINT_TOOLTIP_JUSTIFIED_LEFT_CLASS} {
        transform: translate(-100%);
      }
    }
  }
  .CodeMirror-lint-message {
    && {
      margin-top: 5px;
      margin-bottom: 5px;
      font-family: ${(props) => props.theme.fonts.text};
      color: var(--ads-v2-color-fg);
      background-position: 0 2.8px;
      padding-left: 20px;
    }
  }
  .CodeMirror-lint-mark-warning {
    && {
      background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJFhQXEbhTg7YAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAMklEQVQI12NkgIIvJ3QXMjAwdDN+OaEbysDA4MPAwNDNwMCwiOHLCd1zX07o6kBVGQEAKBANtobskNMAAAAASUVORK5CYII=");
    }
  }

  .CodeMirror-lint-message-error {
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFlSURBVHgBrVLRTcMwELWDg8QHtJ2AfFZtJNIJgAnoCOkEZIMkIzBBwwSwAR0hSG3VzzABhahCSmKbOyVxLJQEJPp+7DvfvXe+O0L+CdrmTG37RkjpwOMV2pLSt1PGorM4TnoJpOMM06JYEinnpB2RaZqhTqQIvhzHyvP8Ba4W6UfCTXM2iuM9GkbthWT/D8kI6yTLlrVh1OpwuLVTEhLDv0NlS/mAPkVB6Rz7pAiyonB1CXCuBut1gCSQHA62W8+g9FmPwSbjySoJS38ENS+dTPbnQII2qPlAFOgx9YQM0gGhNVh0jLupgNIEqmgqKMsOUJkIQbCSD9seUinvVQzshiLAP0O639RH79LpdABEHtwJfAdZr6VeYVFE1VdKfNr2U88C/UR0sdksKvESnLEFKCS/ZWIM51yNWBHgZgnObyHgsTMbRikOh9lot0uUqy3ufTy2DMZcaNplpfoKexBDM1fk2PgGIxqcuvBfxngAAAAASUVORK5CYII=");
  }
`;
