import { Classes, ControlGroup } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";

import { DropdownOption } from "../constants";
import { Select } from "@blueprintjs/select";
import {
  BlueprintCSSTransform,
  createGlobalStyle,
} from "constants/DefaultTheme";
import { isEmptyOrNill } from "../../../utils/helpers";
import { LabelPosition, LABEL_MARGIN_OLD_SELECT } from "components/constants";
import { labelLayoutStyles, LABEL_CONTAINER_CLASS } from "design-system";
import { lightenColor } from "widgets/WidgetUtils";
import { CommonSelectFilterStyle } from "widgets/MultiSelectWidgetV2/component/index.styled";

export const StyledDiv = styled.div`
  display: flex;
`;

export const StyledControlGroup = styled(ControlGroup)<{
  $compactMode: boolean;
  $labelPosition?: LabelPosition;
  $isDisabled?: boolean;
}>`
  &&& > {
    span {
      height: 100%;
      max-width: 100%;

      & > span {
        height: 100%;
      }
      .cancel-icon {
        svg {
          width: 10px !important;
          height: 10px !important;
          fill: var(--wds-color-icon);

          path {
            fill: ${({ $isDisabled }) =>
              $isDisabled
                ? "var(--wds-color-icon-disabled)"
                : "var(--wds-color-icon)"};
            stroke: ${({ $isDisabled }) =>
              $isDisabled
                ? "var(--wds-color-icon-disabled)"
                : "var(--wds-color-icon)"} !important;
          }
        }
      }
      .dropdown-icon {
        width: 20px;

        svg {
          fill: var(--wds-color-icon);
          width: 20px;
          height: 20px;

          path {
            fill: ${({ $isDisabled }) =>
              $isDisabled
                ? "var(--wds-color-icon-disabled)"
                : "var(--wds-color-icon)"};
          }
        }
      }
    }
  }
`;

const SingleDropDown = Select.ofType<DropdownOption>();
export const StyledSingleDropDown = styled(SingleDropDown)<{
  value: string;
  isValid: boolean;
  hasError?: boolean;
  borderRadius: string;
  boxShadow?: string;
  accentColor?: string;
}>`
  div {
    flex: 1 1 auto;
  }
  span {
    width: 100%;
    position: relative;
    & > div {
      height: 100%;
    }
  }
  &&&& .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: space-between;
    background: white;
    min-height: 32px;
    padding-left: 12px;
    padding: 0px 10px;
    border-radius: ${(props) => props.borderRadius} !important;
    box-shadow: ${(props) => props.boxShadow} !important;
    border: 1px solid;
    border-color: ${(props) =>
      props.hasError
        ? "var(--wds-color-border-danger)"
        : "var(--wds-color-border)"};
    &:hover {
      border-color: ${(props) =>
        props.hasError
          ? "var(--wds-color-border-danger-hover)"
          : "var(--wds-color-border-hover)"};
    }
    &:focus {
      outline: 0;
      border-color: ${(props) =>
        props.hasError ? "var(--wds-color-border-danger)" : props.accentColor};
      box-shadow: ${(props) =>
        `0px 0px 0px 2px ${lightenColor(
          props.hasError ? Colors.DANGER_SOLID : props.accentColor,
        )} !important;`};
    }
  }

  &&&&& .${Classes.POPOVER_OPEN} .${Classes.BUTTON} {
    outline: 0;
    ${(props) =>
      !props.hasError
        ? `
        border-color: ${
          props.hasError ? "var(--wds-color-border-danger)" : props.accentColor
        };
        box-shadow: ${`0px 0px 0px 2px ${lightenColor(
          props.hasError ? Colors.DANGER_SOLID : props.accentColor,
        )} !important;`};
      `
        : `border: 1px solid var(--wds-color-border-danger);`}
  }
  &&&&& .${Classes.DISABLED} {
    background-color: var(--wds-color-bg-disabled);
    border: 1px solid var(--wds-color-border-disabled);
    .${Classes.BUTTON_TEXT} {
      color: ${(props) =>
        !isEmptyOrNill(props.value)
          ? "var(--wds-color-text-disabled)"
          : "var(--wds-color-text-disabled-light)"};
    }
  }
  .${Classes.BUTTON_TEXT} {
    word-break: break-word;
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    color: ${(props) =>
      !isEmptyOrNill(props.value)
        ? "var(--wds-color-text)"
        : "var(--wds-color-text-light)"};
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: var(--wds-color-icon-disabled);
    }
  }
`;

export const DropdownStyles = createGlobalStyle<{
  dropDownWidth: number;
  id: string;
  borderRadius: string;
  accentColor?: string;
}>`
${({ dropDownWidth, id }) => `
  .select-popover-width-${id} {
    width: ${dropDownWidth}px !important;
  }
`}
.select-popover-wrapper {
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
  border-radius: ${({ borderRadius }) =>
    `min(${borderRadius}, 0.375rem) !important`};
  overflow: hidden;
  background: white;
  ${CommonSelectFilterStyle}
  && .${Classes.MENU} {
    margin-top: -3px;
    max-width: 100%;
    max-height: auto;
    min-width: 0px !important;
  }
  &&&& .${Classes.MENU_ITEM} {
    min-height: 38px;
    padding: 9px 12px;
    border-radius: 0;
    color: ${Colors.GREY_8};
    &:hover{
      background: var(--wds-color-bg-hover);
    }
    &.is-focused{
      background: var(--wds-color-bg-focus);
    }
    &.${Classes.ACTIVE} {
      background: ${({ accentColor }) => `${lightenColor(accentColor)}`};
      color: ${Colors.GREY_10};
      position:relative;
    }
  }
}
`;

export const DropdownContainer = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  ${BlueprintCSSTransform}
  ${labelLayoutStyles}

  /**
    When the label is on the left it is not center aligned
    here set height to auto and not 100% because the input 
    has fixed height and stretch the container.
  */
    ${({ labelPosition }) => {
      if (labelPosition === LabelPosition.Left) {
        return `
      height: auto !important;
      align-items: stretch;
      `;
      }
    }}

  & .${LABEL_CONTAINER_CLASS} {
    label {
      ${({ labelPosition }) => {
        if (!labelPosition) {
          return `margin-bottom: ${LABEL_MARGIN_OLD_SELECT}`;
        }
      }};
    }
  }
`;

export const MenuItem = styled.div<{
  accentColor?: string;
}>`
  & .menu-item-link {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    color: inherit;
    line-height: 20px;
    padding: 5px 7px;
    text-decoration: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;

    min-height: 38px;
    padding: 9px 12px;
    color: var(--wds-color-text);
    outline: none !important;
    background-color: transparent;

    &:hover {
      background-color: var(--wds-color-bg-hover);
      color: var(--wds-color-text);
      position: relative;
    }
  }

  & .menu-item-active {
    background-color: ${({ accentColor }) =>
      lightenColor(accentColor)} !important;

    &:hover {
      background-color: ${({ accentColor }) =>
        lightenColor(accentColor, "0.90")} !important;
    }
  }

  && .has-focus {
    color: var(--wds-color-text);
    background-color: var(--wds-color-bg-focus) !important;
  }

  && .has-focus.menu-item-active {
    background-color: ${({ accentColor }) =>
      lightenColor(accentColor, "0.90")} !important;
  }

  & .menu-item-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-word;
    flex-grow: 1;
    flex-shrink: 1;
    margin-right: 0;
  }
`;
