import styled, { css } from "styled-components";
import FormRow from "components/editorComponents/FormRow";
import {
  JS_OBJECT_HOTKEYS_CLASSNAME,
  RUN_GUTTER_CLASSNAME,
  RUN_GUTTER_ID,
} from "./constants";
import { thinScrollbar } from "constants/DefaultTheme";

export const CodeEditorWithGutterStyles = css`
  .${RUN_GUTTER_ID} {
    width: 0.5em;
    background: #f0f0f0;
    margin-left: 5px;
  }
  .${RUN_GUTTER_CLASSNAME} {
    cursor: pointer;
    color: #f86a2b;
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
  height: ${({ theme }) =>
    `calc(100vh - ${theme.smallHeaderHeight} - ${theme.backBanner})`};
  overflow: hidden;
  .${JS_OBJECT_HOTKEYS_CLASSNAME} {
    width: 100%;
    height: 100%;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: ${({ theme }) => `calc(100% - ${theme.backBanner})`};
  overflow: hidden;
  .t--no-binding-prompt {
    display: none;
  }
  flex: 1;
  padding: 20px 0px 0px 0px;
`;

export const StyledFormRow = styled(FormRow)`
  padding: 0px 20px;
  flex: 0;
`;

export const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

  & > div {
    margin: 0 0 0 ${(props) => props.theme.spaces[7]}px;
  }

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
    height: 30px;
  }
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
  border-top: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  ${thinScrollbar}
  ${FormRow} {
    min-height: auto;
    padding: ${(props) => props.theme.spaces[0]}px;
    & > * {
      margin-right: 0px;
    }
  }
  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[11]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
    }
    .react-tabs__tab-panel {
      ${CodeEditorWithGutterStyles}
      height: calc(100% - 32px);
      background-color: ${(props) => props.theme.colors.apiPane.bg};
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
    }
  }
`;
