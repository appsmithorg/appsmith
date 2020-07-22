import React from "react";
import { IconName } from "./Icons";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { variant, typography } from "styled-system";

type ButtonProps = CommonComponentProps & {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  text?: string;
  category?: "primary" | "secondary" | "tertiary"; //default primary
  variant?: "success" | "info" | "warning" | "danger" | "link"; //default info
  icon?: IconName; //default undefined.
  size?: "small" | "medium" | "large"; // default medium
};
// https://design.gitlab.com/components/button

const StyledButton = styled("button")(
  typography,
  variant({
    prop: "size",
    scale: "buttonSizes",
    variants: {
      medium: {},
    },
  }),
  variant({
    prop: "variant",
    scale: "buttonVariant",
    variants: {
      successPrimary: {},
    },
  }),
);

function AdsButton(props: ButtonProps) {
  return (
    <StyledButton {...props} onClick={e => props.onClick(e)}>
      {props.text}
    </StyledButton>
  );
}

export default AdsButton;
