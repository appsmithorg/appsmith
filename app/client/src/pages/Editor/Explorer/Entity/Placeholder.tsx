import React, { ReactNode } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
const Wrapper = styled.div<{ step: number }>`
  margin-left: ${(props) => props.step * props.theme.spaces[2]}px;
  width: calc(100% - ${(props) => props.step * props.theme.spaces[2]}px);
  font-size: ${(props) => props.theme.fontSizes[2]}px;
  color: ${Colors.DOVE_GRAY2};
  padding: 5px 20px;
  text-align: left;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

export function EntityPlaceholder(props: {
  step: number;
  children: ReactNode;
}) {
  return (
    <Wrapper step={props.step}>
      <p>{props.children}</p>
    </Wrapper>
  );
}

export default EntityPlaceholder;
