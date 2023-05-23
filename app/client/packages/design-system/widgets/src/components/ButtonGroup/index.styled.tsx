import styled from "styled-components";

import type { ButtonGroupProps } from "./ButtonGroup";

export const StyledContainer = styled.div<ButtonGroupProps>`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  &[data-orientation="vertical"] {
    flex-direction: column;
  }

  & > :is([data-button], div) {
    // increasing z index to make sure the focused button is on top of the others
    &:is([data-button])[data-focused]:not([data-disabled]),
    &:is(div) [data-button][data-focused]:not([data-disabled]) {
      z-index: 1;
    }

    &:first-child:is([data-button]),
    &:first-child:is(div) [data-button] {
      border-bottom-right-radius: 0;
    }

    &:last-of-type:is([data-button]),
    &:last-of-type:is(div) [data-button] {
      border-top-left-radius: 0;
    }

    &:not(:first-child):not(:last-of-type):is([data-button]),
    &:not(:first-child):not(:last-of-type):is(div) [data-button] {
      border-radius: 0;
    }
  }

  &:not([data-orientation="vertical"]) > :is([data-button], div) {
    &:first-child:is([data-button]),
    &:first-child:is(div) [data-button] {
      border-top-right-radius: 0;
      border-right-width: calc(var(--border-width-1) / 2);
    }

    &:last-of-type:is([data-button]),
    &:last-of-type:is(div) [data-button] {
      border-bottom-left-radius: 0;
      border-left-width: calc(var(--border-width-1) / 2);
    }

    &:not(:first-child):not(:last-of-type):is([data-button]),
    &:not(:first-child):not(:last-of-type):is(div) [data-button] {
      border-left-width: calc(var(--border-width-1) / 2);
      border-right-width: calc(var(--border-width-1) / 2);
    }

    &:is([data-button]) + [data-button],
    &:is(div) + div {
      margin-left: calc(var(--border-width-1) * -1);

      @media (min-resolution: 192dpi) {
        margin-left: 0px;
      }
    }
  }

  &[data-orientation="vertical"] [data-button] {
    &:first-child:is([data-button]),
    &:first-child:is(div) [data-button] {
      border-bottom-left-radius: 0;
      border-bottom-width: calc(var(--border-width-1) / 2);
    }

    &:last-of-type:is([data-button]),
    &:last-of-type:is(div) [data-button] {
      border-top-right-radius: 0;
      border-top-width: calc(var(--border-width-1) / 2);
    }

    &:not(:first-child):not(:last-of-type):is([data-button]),
    &:not(:first-child):not(:last-of-type):is(div) [data-button] {
      border-top-width: calc(var(--border-width-1) / 2);
      border-bottom-width: calc(var(--border-width-1) / 2);
    }

    &:is([data-button]) + [data-button],
    &:is(div) + div {
      margin-top: calc(var(--border-width-1) * -1);

      @media (min-resolution: 192dpi) {
        margin-top: 0px;
      }
    }
  }
`;
