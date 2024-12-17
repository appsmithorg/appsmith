import styled, { css } from "styled-components";

const Variables = css`
  --ads-v2-colors-control-segment-value-active-fg: var(--ads-v2-color-fg);
  --ads-v2-colors-control-segment-value-default-fg: var(
    --ads-v2-color-fg-muted
  );
`;

export const StyledSegmentedControl = styled.div<{
  isDisabled?: boolean;
  isFullWidth?: boolean;
}>`
  ${Variables}

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ads-v2-spaces-2);
  background-color: var(--ads-v2-colors-control-track-default-bg);
  padding: var(--ads-v2-spaces-1);
  /* outer radius = inner radius + padding */
  border-radius: calc(var(--ads-v2-border-radius) + var(--ads-v2-spaces-1));
  box-sizing: border-box;
  height: 32px;
  width: ${({ isFullWidth }) => (isFullWidth ? "100%" : "max-content")};
`;

export const StyledSegment = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--ads-v2-spaces-2);
  height: 100%;
  border: 1px solid transparent;
  user-select: none;
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-3);

  & > * {
    color: var(--ads-v2-colors-control-segment-value-default-fg);
  }
`;

export const StyledControlContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 0%;
  position: relative;
  border: 1px solid transparent;
  border-radius: var(--ads-v2-border-radius);
  background-color: transparent;
  box-sizing: border-box;
  cursor: pointer;
  height: 100%;

  &:focus-visible {
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline) !important;
    outline-offset: var(--ads-v2-offset-outline) !important;
  }

  &[data-disabled="true"] {
    opacity: var(--ads-v2-opacity-disabled);
    cursor: not-allowed !important;
  }

  &[data-selected="true"] {
    background-color: var(--ads-v2-colors-control-knob-default-bg);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.12);

    & > ${StyledSegment} > * {
      color: var(--ads-v2-colors-control-segment-value-active-fg);
    }
  }

  /* Select all segments which is not a selected and last child */
  /* seperator */
  &:not(:last-child):not([data-selected="true"]):not(
      :has(+ [data-selected="true"])
    ):after {
    content: "";
    position: absolute;
    right: 0;
    width: 1px;
    height: 16px;
    background-color: var(--ads-v2-colors-control-field-default-border);
  }

  /* This before is to mask the separator in left side of selected control */
  /* Mask the seperator with track background color */
  &[data-selected="true"]:not(:first-child):after {
    content: "";
    position: absolute;
    left: -7px;
    width: 2px;
    height: 16px;
    background-color: var(--ads-v2-colors-control-track-default-bg);
  }
`;
