import styled, { css } from "styled-components";
import { Button as HeadlessButton } from "@design-system/headless";

import type { ButtonProps } from "./Button";

export const BUTTON_ICON_POSITIONS = ["start", "end"] as const;

export type ButtonIconPosition = (typeof BUTTON_ICON_POSITIONS)[number];

export const BUTTON_VARIANT = {
  filled: "filled",
  outlined: "outlined",
  ghost: "ghost",
} as const;

export type ButtonVariant =
  (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export const BUTTON_COLOR = {
  accent: "accent",
  neutral: "neutral",
  positive: "positive",
  negative: "negative",
  warning: "warning",
} as const;

export type ButtonColor = (typeof BUTTON_COLOR)[keyof typeof BUTTON_COLOR];

export const buttonStyles = css<ButtonProps>`
  ${({ color = "accent", variant = "filled" }) => {
    if (variant === "filled") {
      return css`
        background-color: var(--color-bg-${color});
        color: var(--color-fg-on-${color});
        border-color: transparent;

        &[data-hovered] {
          background-color: var(--color-bg-${color}-hover);
        }

        &[data-active] {
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

        &[data-hovered] {
          background-color: var(--color-bg-${color}-subtle-hover);
        }

        &[data-active] {
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

        &[data-hovered] {
          background: var(--color-bg-${color}-subtle-hover);
        }

        &[data-active] {
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
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-4);
  height: calc(var(--root-unit) * 8);
  border-radius: var(--border-radius-1);
  user-select: none;
  min-width: calc(var(--root-unit) * 7.5);
  text-align: center;
  position: relative;

  ${buttonStyles}

  // TODO(Valera): remove this when we use only flex layout
  &[data-fit-container] {
    width: 100%;
    height: 100%;
  }

  &[data-focused] {
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-bd-focus);
  }

  &[data-disabled],
  // TODO(Pawan): Check if we need to make the UI of loading state same as disabled?
  &[aria-disabled]:not([data-loading]) {
    cursor: default;
    opacity: var(--opacity-disabled);
  }

  &[data-loading] {
    cursor: default;
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
