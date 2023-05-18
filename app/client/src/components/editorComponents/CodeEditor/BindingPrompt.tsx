import React, { useRef } from "react";
import styled from "styled-components";
import type { EditorTheme } from "./EditorConfig";

const Wrapper = styled.span<{
  visible: boolean;
  bottomOffset: number;
  customMessage: boolean;
  editorTheme?: EditorTheme;
}>`
  padding: ${(props) => (props.customMessage ? 6 : 8)}px;
  font-size: 12px;
  color: var(--appsmith-color-black-800);
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 0px;
  background-color: ${(props) =>
    props.theme.colors.codeMirror.background.hoverState};
  position: absolute;
  bottom: ${(props) => props.bottomOffset}px;
  transform: translateY(100%);
  width: 100%;
  line-height: 13px;
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
  z-index: 3;
`;

const CurlyBraces = styled.span`
  color: var(--appsmith-color-black-800);
  background-color: ${(props) =>
    props.theme.colors.codeMirror.background.hoverState};
`;

function BindingPrompt(props: {
  promptMessage?: React.ReactNode | string;
  isOpen: boolean;
  editorTheme?: EditorTheme;
  showLightningMenu?: boolean;
}): JSX.Element {
  const promptRef = useRef<HTMLDivElement>(null);
  const customMessage = !!props.promptMessage;
  const bottomOffset = customMessage ? 6 : -2;

  return (
    <Wrapper
      bottomOffset={bottomOffset}
      className="t--no-binding-prompt"
      customMessage={customMessage}
      editorTheme={props.editorTheme}
      ref={promptRef}
      visible={props.isOpen}
    >
      {props.promptMessage ? (
        props.promptMessage
      ) : (
        <>
          Type{" "}
          <CurlyBraces>
            {props.showLightningMenu === false ? "{{" : "/"}
          </CurlyBraces>{" "}
          {props.showLightningMenu === false
            ? "to see a list of variables"
            : "to access quick commands"}
        </>
      )}
    </Wrapper>
  );
}

export default BindingPrompt;
