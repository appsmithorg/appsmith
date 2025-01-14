import styled, { css } from "styled-components";
import { Text } from "../Text";

const Variables = css`
  --ads-v2-colors-control-switch-track-default-bg: var(
    --ads-v2-color-bg-emphasis
  );
  --ads-v2-colors-control-switch-track-hover-bg: var(
    --ads-v2-color-bg-emphasis-plus
  );
  --ads-v2-colors-control-switch-track-checked-bg: var(
    --ads-v2-color-bg-brand-secondary
  );
  --ads-v2-colors-control-switch-track-checked-hover-bg: var(
    --ads-v2-color-bg-brand-secondary-emphasis
  );
`;

export const StyledSwitch = styled.label`
  display: block;
  width: 100%;
`;

export const StyledSwitchLabel = styled(Text)<{
  isDisabled?: boolean;
}>`
  display: flex;
  flex-grow: 1;
  gap: var(--ads-v2-spaces-3);
  align-items: center;
  justify-content: space-between;
  min-width: 9rem;
  cursor: pointer;
  word-break: break-all;

  ${({ isDisabled }) =>
    isDisabled &&
    css`
      cursor: not-allowed;
      opacity: var(--ads-v2-opacity-disabled);
    `}
`;

export const StyledSwitchInput = styled.input<{
  isDisabled?: boolean;
  isSelected?: boolean;
  isFocusVisible?: boolean;
}>`
  ${Variables};

  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;

  // the track
  width: 2rem;
  height: 1.25rem;
  min-width: 2rem;
  min-height: 1.25rem;

  display: grid;
  grid: [on] 1fr / [off] 1fr;

  padding: var(--ads-v2-spaces-1);
  margin: 0;
  cursor: pointer;
  border-radius: 10px;
  background-color: var(--ads-v2-colors-control-switch-track-default-bg);

  outline: none;

  ${({ isFocusVisible }) =>
    isFocusVisible &&
    `
      outline: var(--ads-v2-border-width-outline) solid var(--ads-v2-color-outline);
      outline-offset: var(--ads-v2-offset-outline);
    `}

  &:hover {
    background-color: var(--ads-v2-colors-control-switch-track-hover-bg);
  }

  &:checked {
    justify-content: flex-end;
    background-color: var(--ads-v2-colors-control-switch-track-checked-bg);

    // set position of track when checked
    &::before {
      grid-area: on;
      box-shadow: 0 1px 4px 0 var(--ads-v2-color-gray-900);
    }
  }

  &:checked:hover {
    background-color: var(
      --ads-v2-colors-control-switch-track-checked-hover-bg
    );
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--ads-v2-opacity-disabled);

    &:hover {
      background-color: var(--ads-v2-colors-control-switch-track-default-bg);
    }

    &:checked:hover {
      background-color: var(--ads-v2-colors-control-switch-track-checked-bg);
    }
  }

  // the knob
  &::before {
    content: "";
    width: 1rem;
    height: 1rem;
    grid-area: off;
    border-radius: var(--ads-v2-border-radius-circle);
    background-color: var(--ads-v2-colors-control-knob-default-bg);
    box-shadow: 0 1px 4px 0 rgba(76, 86, 100, 0.2);
  }
`;
