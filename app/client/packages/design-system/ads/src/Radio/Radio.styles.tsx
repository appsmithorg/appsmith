import styled, { css } from "styled-components";
import { RadioDotClassName } from "./Radio.constants";

const Variables = css`
  --ads-v2-colors-control-radio-dot-checked-bg: var(
    --ads-v2-color-bg-brand-secondary
  );
  --ads-v2-colors-control-radio-dot-checked-hover-bg: var(
    --ads-v2-color-bg-brand-secondary-emphasis
  );

  --radio-color-border: var(--ads-v2-colors-control-field-default-border);
  --radio-color-dot: var(--ads-v2-colors-control-radio-dot-checked-bg);
  --radio-color-label: var(--ads-v2-color-fg);
`;

const BasicStyles = css`
  input[type="radio"] {
    position: absolute;
    opacity: 0;
  }

  cursor: pointer;
  position: relative;
  padding-left: var(--ads-v2-spaces-7);
  font-family: var(--ads-v2-font-family);
  color: var(--radio-color-label);

  span${"." + RadioDotClassName}::before {
    content: "";
    position: absolute;
    width: var(--ads-v2-spaces-5);
    height: var(--ads-v2-spaces-5);
    background-color: var(--ads-v2-colors-control-field-default-bg);
    border: 1px solid var(--radio-color-border);
    border-radius: 50%;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    transition: border-color 400ms ease;
  }

  span${"." + RadioDotClassName}::after {
    content: "";
    position: absolute;
    width: var(--ads-v2-spaces-5);
    height: var(--ads-v2-spaces-5);
    background-color: var(--radio-color-dot);
    border: 1px solid var(--radio-color-dot);
    border-radius: 50%;
    top: 50%;
    left: 0;
    transform: translateY(-50%) scale(0);
    transition: transform 200ms ease;
  }

  input[type="radio"]:checked + span${"." + RadioDotClassName}::before {
    --radio-color-border: var(--ads-v2-colors-control-field-checked-border);
  }

  input[type="radio"]:checked + span${"." + RadioDotClassName}::after {
    transform: translateY(-50%) scale(0.55);
  }

  /* unchecked hover - outer circle */
  input[type="radio"]:hover:not(:disabled)
    + span${"." + RadioDotClassName}::before {
    --radio-color-border: var(--ads-v2-colors-control-field-hover-border);
  }
  /* checked hover - outer circle */
  input[type="radio"]:checked:hover:not(:disabled)
    + span${"." + RadioDotClassName}::before {
    --radio-color-border: var(
      --ads-v2-colors-control-field-checked-hover-border
    );
  }

  /* checked hover - inner circle */
  input[type="radio"]:checked:hover:not(:disabled)
    + span${"." + RadioDotClassName}::after {
    --radio-color-dot: var(--ads-v2-colors-control-radio-dot-checked-hover-bg);
  }
`;

export const StyledRadio = styled.label<{
  disabled?: boolean;
  isFocusVisible?: boolean;
}>`
  ${Variables}

  ${BasicStyles}

  ${({ disabled }) =>
    disabled &&
    `
    opacity: 0.6;
    cursor: not-allowed !important;
    & > * {
      cursor: not-allowed !important;
    }
  `}

  ${({ isFocusVisible }) =>
    isFocusVisible &&
    `
    input[type="radio"]:checked + span::before {
      outline: var(--ads-v2-border-width-outline) solid var(--ads-v2-color-outline);
      outline-offset: var(--ads-v2-offset-outline);
    }
    `}
`;

export const StyledRadioGroup = styled.div<{
  UNSAFE_gap?: string;
}>`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: ${({ UNSAFE_gap }) => UNSAFE_gap || "var(--ads-v2-spaces-6)"};
  padding-left: var(--ads-v2-spaces-1);

  /* This Aria field is added by react-aria library */
  &[aria-orientation="vertical"] {
    flex-direction: column;
  }

  &[aria-orientation="horizontal"] {
    flex-direction: row;
  }

  &[aria-disabled="true"] {
    opacity: 0.6;
    & * {
      cursor: not-allowed !important;
    }
  }
`;

export const RadioDescription = styled.div`
  margin-top: var(--ads-v2-spaces-2);
  padding-left: var(--ads-v2-spaces-7);
  font-family: var(--ads-v2-font-family);
`;
