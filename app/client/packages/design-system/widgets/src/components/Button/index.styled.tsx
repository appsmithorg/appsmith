import styled, { css } from "styled-components";
import { Button as HeadlessButton } from "@design-system/headless";

import type { ButtonProps } from "./Button";

export const buttonStyles = css<ButtonProps>`
  ${({ color = "accent", variant = "filled" }) => {
    if (variant === "filled") {
      return css`
        background-color: var(--color-bg-${color});
        color: var(--color-fg-on-${color});
        border-color: transparent;

        &[data-hovered]:not([aria-disabled]) {
          background-color: var(--color-bg-${color}-hover);
        }

        &[data-active]:not([aria-disabled]) {
          background-color: var(--color-bg-${color}-active);
        }
      `;
    }

    if (variant === "outlined") {
      return css`
        background-color: transparent;
        color: var(--color-fg-${color});
        border-color: var(--color-bd-${color});
        border-width: var(--border-width-1);

        &[data-hovered]:not([aria-disabled]) {
          background-color: var(--color-bg-${color}-subtle-hover);
        }

        &[data-active]:not([aria-disabled]) {
          background-color: var(--color-bg-${color}-subtle-active);
        }
      `;
    }

    if (variant === "ghost") {
      return css`
        background: transparent;
        color: var(--color-fg-${color});
        border-color: transparent;
        border-width: 0;

        &[data-hovered]:not([aria-disabled]) {
          background: var(--color-bg-${color}-subtle-hover);
        }

        &[data-active]:not([aria-disabled]) {
          background: var(--color-bg-${color}-subtle-active);
        }
      `;
    }
  }}
`;

export const StyledButton = styled(HeadlessButton)<ButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  outline: 0;
  padding: var(--spacing-2) var(--spacing-4);
  height: calc(var(--root-unit) * 8);
  border-radius: var(--border-radius-1);
  user-select: none;
  min-width: calc(var(--root-unit) * 7.5);
  text-align: center;
  position: relative;
  font-weight: 600;

  & *:not([data-hidden]) + *:not([data-hidden]) {
    margin-left: var(--spacing-1);
  }

  ${buttonStyles}

  // TODO(Valera): remove this when we use only flex layout
  &[data-fit-container] {
    width: 100%;
    height: 100%;
  }

  &[data-icon-position="end"] {
    flex-direction: row-reverse;
  }

  /** Note: adding direct selector ">" here because blueprint also has data-icon attribute on their icons */
  & > [data-icon] {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(var(--sizing-root-unit) * 5);
    width: calc(var(--sizing-root-unit) * 5);
  }

  /**
  * ----------------------------------------------------------------------------
  * FOCUSSED
  *-----------------------------------------------------------------------------
  */
  &[data-focused] {
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-bd-focus);
  }

  /**
  * ----------------------------------------------------------------------------
  * DISABLED
  *-----------------------------------------------------------------------------
  */
  &[aria-disabled] {
    cursor: default;
    opacity: var(--opacity-disabled);
  }

  /**
  * ----------------------------------------------------------------------------
  * LOADING
  *-----------------------------------------------------------------------------
  */
  &[data-loading] {
    cursor: default;
    /** adding opacity 1 here because we are lowering opacity for aria-disabled and when loading is true, aria-disabled is also true  */
    opacity: 1;
  }
`;

/**
 * We have this Bug in Firefox where we are unable to drag
 * buttons - https://bugzilla.mozilla.org/show_bug.cgi?id=568313
 *
 * We found a solution here - https://stackoverflow.com/a/43888410
 */
export const DragContainer = styled.div`
  &:after {
    content: "";
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
  }
`;
