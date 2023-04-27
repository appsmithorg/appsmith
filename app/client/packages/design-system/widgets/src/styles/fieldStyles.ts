import { css } from "styled-components";
import type { LabelProps as HeadlessLabelProps } from "@design-system/headless";

type FieldStylesProps = Pick<
  HeadlessLabelProps,
  "labelPosition" | "isEmphasized"
> & {
  labelWidth?: string;
};

// NOTE: these field styles are used in every input component that has a label
// for e.g input, select, checkbox group, toggle group, radio group, etc
export const fieldStyles = css<FieldStylesProps>`
  &[data-field] {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);

    &[data-position="side"] {
      flex-direction: row;
    }

    &[data-disabled] {
      cursor: not-allowed;
      opacity: var(--opacity-disabled);

      & > * {
        pointer-events: none;
      }
    }
  }

  /**
  * ----------------------------------------------------------------------------
  * LABEL
  *-----------------------------------------------------------------------------
  */
  & [data-field-label] {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    height: fit-content;
    color: var(--color-fg);
    font-weight: ${({ isEmphasized }) => (isEmphasized ? "bold" : "normal")};

    //  when the label is on the side, we need to make sure the label is aligned
    &[data-position="side"] {
      min-height: calc(5 * var(--sizing-root-unit));
      width: ${({ labelWidth }) => labelWidth};
    }
  }

  /**
  * ----------------------------------------------------------------------------
  * REQUIRED ICON
  *-----------------------------------------------------------------------------
  */
  & [data-field-necessity-indicator-icon] {
    width: var(--spacing-2);
    height: var(--spacing-2);
  }

  /**
  * ----------------------------------------------------------------------------
  * ERROR TEXT
  *-----------------------------------------------------------------------------
  */
  & [data-field-error-text] {
    display: flex;
    align-items: center;
    color: var(--color-fg-negative);
  }

  /**
  * ----------------------------------------------------------------------------
  * FIELD GROUP
  *-----------------------------------------------------------------------------
  */
  & [data-field-group] {
    gap: var(--spacing-2);
    display: flex;
    flex-direction: column;

    &[data-orientation="horizontal"] {
      flex-direction: row;
    }
  }
`;
