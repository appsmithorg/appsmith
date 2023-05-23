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
  color: var(--ads-v2-color-fg-muted);
  box-shadow: var(--ads-v2-shadow-popovers);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg-muted);
  position: absolute;
  bottom: ${(props) => props.bottomOffset}px;
  transform: translateY(100%);
  width: 100%;
  line-height: 13px;
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
  z-index: 3;
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
          Type <span>{props.showLightningMenu === false ? "{{" : "/"}</span>{" "}
          {props.showLightningMenu === false
            ? "to see a list of variables"
            : "to access quick commands"}
        </>
      )}
    </Wrapper>
  );
}

export default BindingPrompt;
