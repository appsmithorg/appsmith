import React, { ReactNode } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
const Wrapper = styled.div<{ step: number }>`
  margin-left: ${props => props.step * props.theme.spaces[2]}px;
  width: calc(100% - ${props => props.step * props.theme.spaces[2]}px);
  font-size: ${props => props.theme.fontSizes[2]}px;
  color: ${Colors.WHITE};
  padding: ${props => props.theme.spaces[4]}px;
  text-align: left;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const EntityPlaceholder = (props: {
  step: number;
  children: ReactNode;
}) => {
  return (
    <Wrapper step={props.step}>
      <p>{props.children}</p>
    </Wrapper>
  );
};

export default EntityPlaceholder;
