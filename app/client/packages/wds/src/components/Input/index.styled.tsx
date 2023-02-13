import { MouseEventHandler } from "react";
import styled, { css } from "styled-components";

import { Box } from "../Box";
import { BoxProps } from "../Box/Box";
import { InputProps } from "./Input";
import { InputIconProps } from "./InputIcon";

type ContainerProps = BoxProps & {
  onClick?: MouseEventHandler;
} & Pick<InputProps, "variant">;

const variantStyles = ({ variant }: ContainerProps) => {
  switch (variant) {
    case "filled":
      return css`
        background-color: var(--wds-color-bg-light);
        box-shadow: none;
        border: 1px solid var(--wds-color-border-light);
      `;
    case "unstyled":
      return css`
        background-color: transparent;
        border-color: transparent;
        box-shadow: none;
      `;
    default:
      return css`
        background-color: white;
        box-shadow: rgb(208 215 222 / 20%) 0px 1px 0px inset;
        border: 1px solid var(--wds-color-border);
      `;
  }
};

export const Container = styled(Box).withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !["variant"].includes(prop) && defaultValidatorFn(prop),
})<ContainerProps>`
  --gutter: 8px;
  --gap: 6px;

  font-size: 14px;
  line-height: 20px;
  color: var(--wds-color-text);
  vertical-align: middle;
  border-radius: var(--wds-v2-radii);
  outline: none;
  display: inline-flex;
  align-items: stretch;
  min-height: 32px;
  gap: var(--gap);
  padding-left: var(--gutter);
  padding-right: var(--gutter);
  position: relative;
  overflow: hidden;

  & input,
  & textarea {
    cursor: text;
    width: 100%;
    appearance: none;
    background: transparent;
  }

  & input:disabled {
    background: transparent;
  }

  & select {
    cursor: pointer;
    width: 100%;
    appearance: none;
  }

  &::placeholder {
    color: var(--wds-color-text-tertiary);
  }

  &:focus-within {
    border-color: var(--wds-color-border-focus);
    outline: none;
    box-shadow: 0 0 0 1px var(--wds-color-border-focus);
  }

  &[data-disabled] {
    border-color: var(--wds-color-border-disabled);
    background-color: var(--wds-color-bg-disabled);
  }

  &[data-disabled]:hover {
    border-color: var(--wds-color-border-disabled);
  }

  &[data-disabled] input {
    cursor: not-allowed;
  }

  ${variantStyles}
`;

export const StyledIcon = styled.span<Pick<InputIconProps, "position">>`
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;

  color: var(--wds-color-icon);
`;
