import React, { useRef } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const Wrapper = styled.span<{ bottomOffset: number }>`
  padding: 8px;
  font-size: 12px;
  color: ${Colors.GRAY_CHATEAU};
  border-radius: 2px;
  background-color: ${Colors.BLUE_CHARCOAL};
  width: 100%;
  line-height: 16px;
  display: inline-block;
  width: 235px;
`;

const CurlyBraces = styled.span`
  color: white;
  background-color: #f3672a;
  border-radius: 2px;
  padding: 2px;
  margin: 0px 2px;
`;

const BindingPrompt = (props: {
  promptMessage?: React.ReactNode | string;
}): JSX.Element => {
  const promptRef = useRef<HTMLDivElement>(null);
  let bottomOffset = 30;

  if (promptRef.current) {
    const boundingRect = promptRef.current.getBoundingClientRect();
    bottomOffset = boundingRect.height;
  }

  return (
    <Wrapper
      className="t--no-binding-prompt"
      ref={promptRef}
      bottomOffset={bottomOffset}
    >
      {props.promptMessage ? (
        props.promptMessage
      ) : (
        <React.Fragment>
          Type <CurlyBraces>{"{{"}</CurlyBraces> to see a list of variables
        </React.Fragment>
      )}
    </Wrapper>
  );
};

export default BindingPrompt;
