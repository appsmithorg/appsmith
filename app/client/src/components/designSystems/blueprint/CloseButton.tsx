import React from "react";
import styled from "styled-components";
import { Color } from "constants/Colors";
import { Button } from "@blueprintjs/core";
type CloseButtonProps = {
  color: Color;
  size: number;
  onClick: React.MouseEventHandler;
};

const StyledButton = styled(Button)<CloseButtonProps>`
  position: absolute;
  top: 0;
  right: 3px;
  justify-content: center;
  padding: 0;
  color: ${props => props.color};
  & svg {
    width: ${props => props.size};
    height: ${props => props.size};
  }
`;

export const CloseButton = (props: CloseButtonProps) => {
  return <StyledButton {...props} rightIcon="cross" minimal />;
};
