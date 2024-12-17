import styled, { css } from "styled-components";
import {
  InputEndIconClassName,
  InputEndIconDisabledClassName,
  InputIconClassName,
  InputStartIconClassName,
  InputStartIconDisabledClassName,
} from "./Input.constants";
import type { InputSizes } from "./Input.types";
import { Text } from "../Text";
import { iconSizes } from "../Icon";

const Variables = css`
  --input-color-border: var(--ads-v2-colors-control-field-default-border);
  --input-padding-x: var(--ads-v2-spaces-2); // padding left and right
  --input-padding-y: var(--ads-v2-spaces-2); // padding top and bottom
  --input-font-size: var(--ads-v2-font-size-2);
  --input-height: 24px;
`;

const getSizes = (size: InputSizes, component: "input" | "textarea") => {
  const Sizes = {
    sm: css`
      --input-padding-x: var(--ads-v2-spaces-2);
      --input-padding-y: var(--ads-v2-spaces-2);
      --input-font-size: var(--ads-v2-font-size-2);
      --input-height: ${component === "input" ? "24px" : "60px"};
    `,
    md: css`
      --input-padding-x: var(--ads-v2-spaces-3);
      --input-padding-y: var(--ads-v2-spaces-3);
      --input-font-size: var(--ads-v2-font-size-4);
      --input-height: ${component === "input" ? "36px" : "72px"};
    `,
  };

  return Sizes[size];
};

export const MainContainer = styled.div<{
  labelPosition?: "top" | "left";
  size?: InputSizes;
  component: "input" | "textarea";
}>`
  ${Variables};

  display: flex;
  flex-direction: ${({ labelPosition }) =>
    labelPosition === "left" ? "row" : "column"};
  align-items: baseline;
  gap: ${({ labelPosition }) =>
    labelPosition === "left"
      ? "var(--ads-v2-spaces-4)"
      : "var(--ads-v2-spaces-2)"};
  font-family: var(--ads-v2-font-family);
  font-size: var(--input-font-size);
  width: 100%;

  /* Size style */
  ${({ component, size }) => size && getSizes(size, component)}
`;

export const Label = styled.label`
  color: var(--ads-v2-colors-control-label-default-fg);
  width: 100%;
  word-wrap: break-word;

  & > span {
    color: var(--ads-v2-colors-control-icon-error-fg);
    margin-left: var(--ads-v2-spaces-1);
  }
`;

export const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-2);
  width: 100%;
`;

export const InputContainer = styled.div<{
  isDisabled?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 180px;
  color: var(--ads-v2-colors-control-value-default-fg);

  & .${InputIconClassName} {
    position: absolute;
    padding: var(--input-padding-y) var(--input-padding-x);

    & > svg {
      color: inherit;
    }
  }

  & .${InputIconClassName}.${InputStartIconClassName} {
    left: 0;
  }

  & .${InputIconClassName}.${InputEndIconClassName} {
    right: 0;
  }

  & .${InputIconClassName}[data-has-onclick="true"] {
    cursor: pointer;
  }

  ${({ isDisabled }) =>
    isDisabled && `opacity: var(--ads-v2-opacity-disabled);`};

  ${({ isDisabled }) =>
    isDisabled &&
    `
    & * {
      cursor: not-allowed !important;
    }
  `};

  & .${InputEndIconDisabledClassName} {
    opacity: var(--ads-v2-opacity-disabled);
    cursor: not-allowed !important;
  }

  & .${InputStartIconDisabledClassName} {
    opacity: var(--ads-v2-opacity-disabled);
    cursor: not-allowed !important;
  }
`;

export const StyledInput = styled.input<{
  isFocusVisible?: boolean;
  UNSAFE_width?: string;
  UNSAFE_height?: string;
  hasStartIcon?: boolean;
  hasEndIcon?: boolean;
  renderer?: "input" | "textarea";
  inputSize?: InputSizes;
}>`
  --icon-size: ${({ inputSize }) => inputSize && iconSizes[inputSize]};

  background-color: var(--ads-v2-colors-control-field-default-bg);
  border: 1px solid var(--input-color-border);
  border-radius: var(--ads-v2-border-radius);
  font-family: var(--ads-v2-font-family);
  font-size: var(--input-font-size);
  color: var(--ads-v2-colors-control-value-default-fg);
  padding: var(--input-padding-y) var(--input-padding-x);
  box-sizing: border-box;
  width: ${({ UNSAFE_width }) => UNSAFE_width || "100%"};
  height: ${({ UNSAFE_height }) => UNSAFE_height || "var(--input-height)"};
  resize: none;

  /* adjust padding start according to icon present or not */
  /*
   * add left right padding to icon width = padding left right
   * minus 1px border width
  */
  ${({ hasStartIcon, renderer }) =>
    hasStartIcon &&
    renderer === "input" &&
    css`
      padding-left: calc((var(--input-padding-x) * 2) + var(--icon-size) - 1px);
    `}

  /* adjust padding end according to icon present or not */
  ${({ hasEndIcon, renderer }) =>
    hasEndIcon &&
    renderer === "input" &&
    css`
      padding-right: calc(
        (var(--input-padding-x) * 2) + var(--icon-size) - 1px
      );
    `}

  &:hover:enabled:not(:read-only) {
    --input-color-border: var(--ads-v2-colors-control-field-hover-border);
  }

  &:active:enabled:not(:read-only) {
    --input-color-border: var(--ads-v2-colors-control-field-active-border);
  }

  &:disabled {
    cursor: not-allowed;
    user-select: none;
  }

  &[data-is-valid="false"] {
    --input-color-border: var(--ads-v2-colors-control-field-error-border);

    &:hover:enabled:not(:read-only) {
      --input-color-border: var(--ads-v2-colors-control-field-error-border);
    }

    &:active:enabled:not(:read-only) {
      --input-color-border: var(--ads-v2-colors-control-field-error-border);
    }
  }

  ${({ isFocusVisible }) =>
    isFocusVisible &&
    css`
      outline: var(--ads-v2-border-width-outline) solid
        var(--ads-v2-color-outline) !important;
      outline-offset: var(--ads-v2-offset-outline) !important;
    `}

  /* for date picker to work */
  &&&:focus-visible {
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline) !important;
    outline-offset: var(--ads-v2-offset-outline) !important;
  }
`;

export const Description = styled(Text)`
  line-height: unset;
`;

export const Error = styled(Text)`
  line-height: unset;
`;
