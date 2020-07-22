import React from "react";
import { IconName } from "./Icons";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { variant } from "styled-system";

type ButtonProps = CommonComponentProps & {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  text?: string;
  category?: "primary" | "secondary" | "tertiary"; //default primary
  variant?: "success" | "info" | "warning" | "danger" | "link"; //default info
  icon?: IconName; //default undefined.
  size?: "small" | "medium" | "large"; // default medium
};
// https://design.gitlab.com/components/button

const sizeButton = styled("button")(
  variant({
    prop: "size",
    scale: "buttonSizes",
    variants: {
      small: {},
    },
  }),
);

const StyledButton = styled(sizeButton)`
  background-color: ${props => props.theme.colors.success};
  color: ${props => props.theme.colors.success};
  border-color: ${props => props.theme.colors.primary.success};
`;

function AdsButton(props: ButtonProps) {
  return (
    <StyledButton
      {...props}
      onClick={(e: React.MouseEvent<HTMLElement>) =>
        props.onClick && props.onClick(e)
      }
    >
      {props.text}
    </StyledButton>
  );
}

export default AdsButton;
