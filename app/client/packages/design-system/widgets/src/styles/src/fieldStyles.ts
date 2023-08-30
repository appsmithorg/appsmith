import { css } from "styled-components";
import type { LabelProps as HeadlessLabelProps } from "@design-system/headless";

type FieldStylesProps = Pick<HeadlessLabelProps, "isEmphasized" | "labelWidth">;

// NOTE: these field styles are used in every input component that has a label
// for e.g input, select, checkbox group, toggle group, radio group, etc
export const fieldStyles = css<FieldStylesProps>`
  &[data-field] {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);

    &[data-position="side"] {
      flex-direction: row;
    }
  }

  // when the label is on the side, we need to make sure the label
  // is centered aligned in case it is a field. For field group,
  // align-items will be  of default value, that is flex-start
  &[data-field]:is([data-field-type="field"]):is([data-position="side"]) {
    align-items: center;
  }

  /**
  * ----------------------------------------------------------------------------
  * FIELD LABEL
  *-----------------------------------------------------------------------------
  */
  & [data-field-label] {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    height: fit-content;
    color: var(--color-fg);
    font-weight: ${({ isEmphasized }) => (isEmphasized ? "bold" : "normal")};

    //  when the label is on the side, we need to make sure the label is aligned
    &[data-position="side"] {
      width: ${({ labelWidth }) => labelWidth};
    }
  }

  &[data-disabled] [data-field-label] {
    opacity: var(--opacity-disabled);
    cursor: default;
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
      gap: var(--spacing-4);
      flex-direction: row;
    }

    &[data-disabled] [data-label] {
      cursor: default;
    }
  }

  /**
  * ----------------------------------------------------------------------------
  * FIELD WRAPPER
  *-----------------------------------------------------------------------------
  */
  & [data-field-wrapper] {
    gap: var(--spacing-1);
    display: flex;
    flex-direction: column;
  }
`;
