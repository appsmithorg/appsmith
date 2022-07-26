import styled from "styled-components";
import { Alignment, Checkbox as BlueprintCheckbox } from "@blueprintjs/core";
import CheckIcon from "assets/icons/widget/checkbox/check-icon.svg";
import DisabledCheckIcon from "assets/icons/widget/checkbox/disabledcheck-icon.svg";
import IndeterminateIcon from "assets/icons/widget/checkbox/indeterminate-icon.svg";
import DisabledIndeterminate from "assets/icons/widget/checkbox//disabled-indeterminate-icon.svg";

import { darkenColor } from "widgets/WidgetUtils";

type StyledCheckboxProps = {
  checked?: boolean;
  disabled?: boolean;
  borderRadius?: string;
  indeterminate?: boolean;
  hasError?: boolean;
  accentColor?: string;
  inputRef?: (el: HTMLInputElement | null) => any;
};

const Checkbox = styled(BlueprintCheckbox)<StyledCheckboxProps>`
  ${({ accentColor, alignIndicator, borderRadius, hasError }) => `
    margin: 0;
    padding: 0;
    height: auto;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-direction: ${
      alignIndicator === Alignment.RIGHT ? "row-reverse" : "row"
    };

    // base
    &.bp3-control.bp3-checkbox .bp3-control-indicator  {
      margin: 0;
      margin-top: .2rem;
      border: none;
      box-shadow: 0px 0px 0px 1px var(--wds-color-border);
      outline: none !important;
      background-color: white;
      border-radius: ${borderRadius === "0.375rem" ? "0.25rem" : borderRadius};

      // ERROR state ( needed when checkbox is required )
      ${
        hasError
          ? `box-shadow: 0px 0px 0px 1px var(--wds-color-bg-danger);`
          : ""
      };
    }

    &.bp3-control.bp3-checkbox .bp3-control-indicator::before {
      background-repeat: no-repeat;
      background-position: center;
    }

    // active
    &.bp3-control input:not(:disabled):active ~ .bp3-control-indicator {
      background: white !important;
      box-shadow: 0px 0px 0px 1px var(--wds-color-border-hover);
    }

    // hover
    &.bp3-control.bp3-checkbox:hover input:not(:checked) ~ .bp3-control-indicator {
      box-shadow: 0px 0px 0px 1px ${
        hasError
          ? "var(--wds-color-border-danger-hover)"
          : "var(--wds-color-border-hover)"
      };
    }

    // hover on checked
    &.bp3-control.bp3-checkbox:hover input:checked ~ .bp3-control-indicator,  &.bp3-control.bp3-checkbox:hover input:indeterminate ~ .bp3-control-indicator {
      box-shadow: none;
      background: ${darkenColor(accentColor)} !important;
    }

    // hover on disabled
    &.bp3-control.bp3-checkbox:hover input:disabled:not(:checked):not(:indeterminate) ~ .bp3-control-indicator {
      box-shadow: 0px 0px 0px 1px var(--wds-color-border-disabled);
    }

    // hover on checked + disabled
    &.bp3-control.bp3-checkbox:hover input:checked:disabled ~ .bp3-control-indicator {
      box-shadow: 0px 0px 0px 1px var(--wds-color-border-disabled);
      background-color: var(--wds-color-disabled) !important;
    }

    // checked
    &.bp3-control.bp3-checkbox input:checked ~ .bp3-control-indicator,
    &.bp3-control.bp3-checkbox input:indeterminate ~ .bp3-control-indicator {
      background-color: ${accentColor} !important;
      background-image: none;
      border: none !important;
      box-shadow: none;
    }

    // checked + disabled
    &.bp3-control.bp3-checkbox input:checked:disabled ~ .bp3-control-indicator {
      box-shadow: 0px 0px 0px 1px var(--wds-color-border-disabled);
      background-color: var(--wds-color-bg-disabled) !important;
    }
    // not checked + disabled
    &.bp3-control.bp3-checkbox input:not(:checked):disabled ~ .bp3-control-indicator {
      background-color: var(--wds-color-bg-disabled) !important;
    }

    // indeterminate
    &.bp3-control.bp3-checkbox input:indeterminate ~ .bp3-control-indicator {
      box-shadow: none;
    }

    &.bp3-control.bp3-checkbox:hover input:indeterminate ~ .bp3-control-indicator {
      box-shadow: none;
    }

    &.bp3-control.bp3-checkbox input:indeterminate:disabled ~ .bp3-control-indicator {
      background-color: var(--wds-color-bg-disabled) !important;
      box-shadow: 0px 0px 0px 1px var(--wds-color-border-disabled);
    }

    // blueprint specific issues
    &.bp3-control:not(.bp3-align-right) {
      padding-left: 0;
    }

    // checked + disabled icon
    &.bp3-control.bp3-checkbox input:checked:disabled ~ .bp3-control-indicator::before {
      background-image: url(${DisabledCheckIcon});
    }

    // indeterminate icon
    &.bp3-control.bp3-checkbox input:indeterminate ~ .bp3-control-indicator::before {
      background-image: url(${IndeterminateIcon});
    }

    // indeterminate + disabled icon
    &.bp3-control.bp3-checkbox input:indeterminate:disabled ~ .bp3-control-indicator::before {
      background-image: url(${DisabledIndeterminate});
    }

    // checked icon
    &.bp3-control.bp3-checkbox input:checked ~ .bp3-control-indicator::before {
      background-image: url(${CheckIcon})
    }
  `}
`;

export { Checkbox };
