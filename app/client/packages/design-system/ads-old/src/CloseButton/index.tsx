import type { PropsWithChildren } from "react";
import React from "react";
import styled from "styled-components";
import { Button } from "@blueprintjs/core";

type CloseButtonProps = PropsWithChildren<{
  // TODO: fix the type on color, make rigid or add a default
  color: any;
  size: number;
  onClick: React.MouseEventHandler;
  className?: string;
}>;

const StyledButton = styled(Button)<CloseButtonProps>`
  position: absolute;
  top: 0;
  right: 3px;
  justify-content: center;
  padding: 0;
  color: ${(props) => props.color};

  & svg {
    width: ${(props) => props.size};
    height: ${(props) => props.size};

    & path {
      fill: ${(props) => props.color};
    }
  }
`;

export default function CloseButton(props: CloseButtonProps) {
  return (
    <StyledButton
      className={props.className}
      {...props}
      minimal
      rightIcon="cross"
    />
  );
}
