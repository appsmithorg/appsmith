import React, { useRef } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const Wrapper = styled.span<{ visible: boolean; bottomOffset: number }>`
  padding: 8px;
  font-size: 12px;
  color: ${Colors.GRAY_CHATEAU};
  border-radius: 2px;
  background-color: ${Colors.BLUE_CHARCOAL};
  position: absolute;
  bottom: ${props => -props.bottomOffset}px;
  width: 100%;
  line-height: 13px;
  visibility: ${props => (props.visible ? "visible" : "hidden")};
`;

const CurlyBraces = styled.span`
  color: white;
  background-color: #f3672a;
  border-radius: 2px;
  padding: 2px;
  margin: 0px 2px;
`;

const BindingPrompt = () => {
  const promptRef = useRef<HTMLDivElement>(null);
  let bottomOffset = 20;

  if (promptRef.current) {
    const boundingRect = promptRef.current.getBoundingClientRect();
    bottomOffset = boundingRect.height;
  }

  return (
    <Wrapper
      ref={promptRef}
      visible={!!promptRef.current}
      bottomOffset={bottomOffset}
    >
      Type <CurlyBraces>{"{{"}</CurlyBraces> to see a list of variables
    </Wrapper>
  );
};

export default BindingPrompt;
