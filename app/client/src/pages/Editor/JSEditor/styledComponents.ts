import styled, { css } from "styled-components";
import FormRow from "components/editorComponents/FormRow";
import {
  JS_OBJECT_HOTKEYS_CLASSNAME,
  RUN_GUTTER_CLASSNAME,
  RUN_GUTTER_ID,
} from "./constants";
import { thinScrollbar } from "constants/DefaultTheme";
import { IDE_HEADER_HEIGHT } from "@appsmith/ads";

export const CodeEditorWithGutterStyles = css`
  .${RUN_GUTTER_ID} {
    width: 0.5em;
    background: var(--ads-v2-color-bg-subtle);
    margin-left: 5px;
  }

  .${RUN_GUTTER_CLASSNAME} {
    cursor: pointer;
    color: var(--ads-v2-color-fg-brand);
  }

  .CodeMirror-linenumbers {
    width: max-content;
  }

  .CodeMirror-linenumber {
    text-align: right;
    padding-left: 0;
  }

  .cm-s-duotone-light.CodeMirror {
    padding: 0;
  }
`;

export const FormWrapper = styled.div`
  height: calc(100vh - ${IDE_HEADER_HEIGHT}px);
  overflow: hidden;

  .${JS_OBJECT_HOTKEYS_CLASSNAME} {
    width: 100%;
    height: 100%;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .t--no-binding-prompt {
    display: none;
  }

  flex: 1;
`;

export const StyledFormRow = styled(FormRow)`
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-5)
    var(--ads-v2-spaces-7);
  flex: 1;
`;

export const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 50%;
  overflow: hidden;

  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 50%;
  justify-content: flex-end;
  gap: var(--ads-v2-spaces-3);
`;

export const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px);
  overflow: hidden;
`;

export const TabbedViewContainer = styled.div<{ isExecuting: boolean }>`
  flex: 1;
  overflow: auto;
  position: relative;
  padding: 0px ${(props) => props.theme.spaces[11]}px;

  ${thinScrollbar}
  ${FormRow} {
    min-height: auto;
    padding: ${(props) => props.theme.spaces[0]}px;

    & > * {
      margin-right: 0px;
    }
  }

  &&&& {
    ul.ads-v2-tabs__list {
      padding: 0px ${(props) => props.theme.spaces[11]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
    }

    .ads-v2-tabs__panel {
      ${CodeEditorWithGutterStyles};
      height: calc(100% - 38px);
      margin-top: 0px;
      background-color: var(--ads-v2-color-bg);

      .CodeEditorTarget {
        outline: none;
      }

      ${(props) =>
        props.isExecuting &&
        `
        .${RUN_GUTTER_CLASSNAME} {
        cursor: progress;
      }
      `}
      ${CodeEditorWithGutterStyles}
    }

    .ads-v2-tabs,
    .js-editor-tab {
      height: 100%;
    }
  }
`;
