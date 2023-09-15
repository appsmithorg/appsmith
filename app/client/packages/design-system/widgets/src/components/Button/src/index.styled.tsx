import styled, { css } from "styled-components";
import { Button as HeadlessButton } from "@design-system/headless";

import type { ButtonProps } from "./Button";
import type { PickRename } from "../../../utils";

type StyledButtonProps = PickRename<
  ButtonProps,
  {
    color: "$color";
    variant: "$variant";
  }
>;

export const buttonStyles = css<StyledButtonProps>`
  ${({ $color, $variant }) => {
    if ($variant === "filled") {
      return css`
        background-color: var(--color-bg-${$color});
        color: var(--color-fg-on-${$color});
        border-color: transparent;

        &[data-hovered]:not([aria-disabled]) {
          background-color: var(--color-bg-${$color}-hover);
        }

        &[data-active]:not([aria-disabled]) {
          background-color: var(--color-bg-${$color}-active);
        }
      `;
    }

    if ($variant === "outlined") {
      return css`
        background-color: transparent;
        color: var(--color-fg-${$color});
        border-color: var(--color-bd-${$color});

        &[data-hovered]:not([aria-disabled]) {
          background-color: var(--color-bg-${$color}-subtle-hover);
        }

        &[data-active]:not([aria-disabled]) {
          background-color: var(--color-bg-${$color}-subtle-active);
        }
      `;
    }

    if ($variant === "ghost") {
      return css`
        background: transparent;
        color: var(--color-fg-${$color});
        border-color: transparent;

        &[data-hovered]:not([aria-disabled]) {
          background: var(--color-bg-${$color}-subtle-hover);
        }

        &[data-active]:not([aria-disabled]) {
          background: var(--color-bg-${$color}-subtle-active);
        }
      `;
    }
  }}
`;

export const StyledButton = styled(HeadlessButton)<StyledButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  outline: 0;
  cursor: pointer;
  user-select: none;
  position: relative;
  font-family: inherit;
  border-style: solid;
  border-width: var(--border-width-1);
  padding-inline: var(--spacing-5);
  block-size: var(--sizing-8);
  min-inline-size: var(--sizing-8);
  border-radius: var(--border-radius-1);

  // Note: adding important here as ADS is overriding the color of blueprint icon globally
  // TODO(pawan): Remove this once ADS team removes the global override
  &[data-button] .bp3-icon {
    color: currentColor !important;
  }

  ${buttonStyles}

  /**
  * ----------------------------------------------------------------------------
  * CONTENT
  *-----------------------------------------------------------------------------
  */
  & [data-content] {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &[data-icon-position="start"] {
    [data-content] *:not([data-hidden]) + *:not([data-hidden]) {
      margin-inline-start: var(--spacing-1);
    }
  }

  &[data-icon-position="end"] {
    [data-content] *:not([data-hidden]) + *:not([data-hidden]) {
      margin-inline-end: var(--spacing-1);
    }
  }

  &[data-icon-position="end"] [data-content] {
    flex-direction: row-reverse;
  }

  /** Note: adding direct selector ">" here because blueprint also has data-icon attribute on their icons */
  & [data-content] > [data-icon] {
    display: flex;
    justify-content: center;
    align-items: center;
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
  * LOADING AND LOADER
  *-----------------------------------------------------------------------------
  */
  &[data-loading] {
    cursor: default;
    /** adding opacity 1 here because we are lowering opacity for aria-disabled and when loading is true, aria-disabled is also true  */
    opacity: 1;
  }

  &[data-loading] [data-content] {
    visibility: hidden;
  }

  & [data-loader] {
    display: none;
  }

  &[data-loading] [data-loader] {
    display: block;
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: inherit;
  }

  /**
  * ----------------------------------------------------------------------------
  * ICON BUTTON
  *-----------------------------------------------------------------------------
  */
  &[data-icon-button] {
    min-inline-size: initial;
    text-align: center;
    padding: 0;
    container-type: inline-size;

    &[data-size="small"] {
      block-size: var(--sizing-5);
      inline-size: var(--sizing-5);
    }

    &,
    &[data-size="medium"] {
      block-size: var(--sizing-7);
      inline-size: var(--sizing-7);
    }

    &[data-size="large"] {
      block-size: var(--sizing-9);
      inline-size: var(--sizing-9);
    }

    & svg {
      width: 90cqw;
      height: 90cqw;
    }
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
