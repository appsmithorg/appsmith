import styled from "styled-components";
import { Checkbox as BlueprintCheckbox } from "@blueprintjs/core";

import { Colors } from "constants/Colors";
import { lightenColor, darkenColor } from "widgets/WidgetUtils";

type StyledCheckboxProps = {
  checked?: boolean;
  disabled?: boolean;
  backgroundColor?: string;
  borderRadius?: string;
  indeterminate?: boolean;
  hasError?: boolean;
  inputRef?: (el: HTMLInputElement | null) => any;
};

const DISABLED_ICON_SVG =
  "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill-rule='evenodd' clip-rule='evenodd' d='M11 7H5c-.55 0-1 .45-1 1s.45 1 1 1h6c.55 0 1-.45 1-1s-.45-1-1-1z' fill='white'/%3e%3c/svg%3e";
const CHECKED_ICON_SVG =
  "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='14' height='14' /%3E%3Cpath d='M10.1039 3.5L11 4.40822L5.48269 10L2.5 6.97705L3.39613 6.06883L5.48269 8.18305L10.1039 3.5Z' fill='white'/%3E%3C/svg%3E%0A";

const Checkbox = styled(BlueprintCheckbox)<StyledCheckboxProps>`
  ${({ backgroundColor, borderRadius, checked, hasError }) => `
    margin: 0;
    padding: 0;
    height: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    color: ${checked ? Colors.GREY_10 : Colors.GREY_9};

    &.bp3-control.bp3-checkbox .bp3-control-indicator  {
      margin: 0;
      border: none;
      box-shadow: 0px 0px 0px 1px ${Colors.GREY_3};
      outline: none !important;
      background: transparent;
      border-radius: ${borderRadius};

      // ERROR state ( needed when checkbox is required )
      ${hasError && `box-shadow: 0px 0px 0px 1px ${Colors.ERROR_RED};`};
    }

    &.bp3-control.bp3-checkbox input:checked ~ .bp3-control-indicator,
    &.bp3-control.bp3-checkbox input:indeterminate ~ .bp3-control-indicator {
      background: ${backgroundColor} !important;
      background-image: none;
      border: none !important;
      box-shadow: none;
    }

    // ACTIVE
    &.bp3-control.bp3-checkbox:active .bp3-control-indicator {
      background: ${lightenColor(backgroundColor)} !important;
      box-shadow:
        0px 0px 0px 1px ${backgroundColor},
        0px 0px 0px 3px ${lightenColor(backgroundColor)} !important;
    }

    // ACTIVE WHEN DISABLED
    &.bp3-control.bp3-checkbox:active input:disabled ~ .bp3-control-indicator {
      box-shadow: 0px 0px 0px 1px ${Colors.GREY_3} !important;
    }

    // DISABLED
    &.bp3-control.bp3-checkbox input:disabled ~ .bp3-control-indicator {
      opacity: 0.5;
      background: ${Colors.GREY_5} !important;
      color: ${Colors.GREY_8};

      &::before {
        background-image: url("${DISABLED_ICON_SVG}") !important;
      }
    }

    &.bp3-control.bp3-checkbox input:checked ~ .bp3-control-indicator {
      &::before {
        background-image: url("${CHECKED_ICON_SVG}") !important;
      }
    }

    // CHECKED
    &.bp3-control.bp3-checkbox input:checked ~ .bp3-control-indicator {
      background: ${backgroundColor} !important;
    }

    // HOVER WHEN CHECKED
    &.bp3-control.bp3-checkbox:hover input:checked ~ .bp3-control-indicator {
      box-shadow: none;
      background: ${darkenColor(backgroundColor)} !important;
    }

    // HOVER WHEN UNCHECKED
    &.bp3-control.bp3-checkbox:hover :not(input:checked) ~ .bp3-control-indicator {
      box-shadow: 0px 0px 0px 1px ${Colors.GREY_5};
    }

    // INDETERMINATE
    &.bp3-control.bp3-checkbox input:indeterminate ~ .bp3-control-indicator {
      box-shadow: none;
    }

    // BLUEPRINT DEFAULT ISSUES
    &.bp3-control:not(.bp3-align-right) {
      padding-left: 0;
    }
  `}
`;

Checkbox.defaultProps = {
  backgroundColor: "#553DE9",
  borderRadius: "0.375rem",
};

export { Checkbox };
