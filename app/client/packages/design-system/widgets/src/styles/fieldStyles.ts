import { css } from "styled-components";
import type { LabelProps as HeadlessLabelProps } from "@design-system/headless";

type FieldStylesProps = Pick<
  HeadlessLabelProps,
  "labelPosition" | "labelWidth" | "isEmphasized"
>;

// NOTE: these field styles are used in every input component that has a label
// for e.g input, select, checkbox group, toggle group, radio group, etc
export const fieldStyles = css<FieldStylesProps>`
  &.field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);

    &--positionSide {
      flex-direction: row;
    }

    &.is-disabled {
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
  & .fieldLabel {
    height: fit-content;
    color: var(--color-fg);
    font-weight: ${({ isEmphasized }) => (isEmphasized ? "bold" : "normal")};

    //  when the label is on the side, we need to make sure the label is aligned
    ${({ labelPosition, labelWidth }) => {
      if (labelPosition === "side") {
        return css`
          display: flex;
          align-items: center;
          min-height: calc(5 * var(--sizing-root-unit));
          width: ${labelWidth ?? "max-content"};
        `;
      }
    }}
  }

  /**
  * ----------------------------------------------------------------------------
  * REQUIRED ICON
  *-----------------------------------------------------------------------------
  */
  & .required-icon {
    width: var(--spacing-3);
    height: var(--spacing-3);
  }

  /**
  * ----------------------------------------------------------------------------
  * ERROR TEXT
  *-----------------------------------------------------------------------------
  */
  &.field .errorText {
    display: flex;
    align-items: center;
    color: var(--color-fg-negative);
  }

  /**
  * ----------------------------------------------------------------------------
  * FIELD GROUP
  *-----------------------------------------------------------------------------
  */
  & .fieldGroup {
    gap: var(--spacing-2);
    display: flex;
    flex-direction: column;

    &--horizontal {
      flex-direction: row;
    }
  }
`;
