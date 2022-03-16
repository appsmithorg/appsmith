import { Classes, ControlGroup, Label } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
import { DropdownOption } from "../constants";
import { Select } from "@blueprintjs/select";
import {
  BlueprintCSSTransform,
  createGlobalStyle,
} from "constants/DefaultTheme";
import { isEmptyOrNill } from ".";
import { lightenColor } from "widgets/WidgetUtils";

export const TextLabelWrapper = styled.div<{
  compactMode: boolean;
}>`
  ${(props) =>
    props.compactMode ? "&&& {margin-right: 5px;}" : "width: 100%;"}
  display: flex;
`;

export const StyledDiv = styled.div`
  display: flex;
`;
export const StyledLabel = styled(Label)<{
  $compactMode: boolean;
  $disabled: boolean;
  $labelText?: string;
  $labelTextColor?: string;
  $labelTextSize?: TextSize;
  $labelStyle?: string;
}>`
  overflow-y: hidden;
  text-overflow: ellipsis;
  width: ${(props) => (props.$compactMode ? "auto" : "100%")};
  text-align: left;
  color: ${(props) =>
    props.$labelTextColor
      ? props.$labelTextColor
      : props.$disabled
      ? Colors.GREY_8
      : "inherit"};
  font-size: ${(props) =>
    props.$labelTextSize ? TEXT_SIZES[props.$labelTextSize] : "14px"};
  font-weight: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
`;

export const StyledControlGroup = styled(ControlGroup)`
  flex-grow: 1;

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
        }
      }
      .dropdown-icon {
        width: 20px;
        svg {
          width: 20px;
          height: 20px;
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
  primaryColor?: string;
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
    box-shadow: ${(props) => props.boxShadow} !important;
    background: white;
    min-height: 32px;
    padding-left: 12px;
    padding: 0px 10px;
    border-radius: ${(props) => props.borderRadius} !important;
    border: 1px solid;
    border-color: ${(props) =>
      props.hasError ? Colors.DANGER_SOLID : Colors.GREY_3};
    ${(props) =>
      props.isValid
        ? `
        &:hover {
          border-color: ${Colors.GREY_5};
        }
        &:focus {
          outline: 0;
          border-color:
            ${props.hasError ? Colors.DANGER_SOLID : props.primaryColor};
          box-shadow:
            ${`0px 0px 0px 3px ${lightenColor(
              props.hasError ? Colors.DANGER_SOLID : props.primaryColor,
            )} !important;`};
        }
      `
        : ""};
  }
  &&&&& .${Classes.POPOVER_OPEN} .${Classes.BUTTON} {
    outline: 0;
    ${(props) =>
      !props.hasError
        ? `
        border-color: ${
          props.hasError ? Colors.DANGER_SOLID : props.primaryColor
        };
        box-shadow: ${`0px 0px 0px 3px ${lightenColor(
          props.hasError ? Colors.DANGER_SOLID : props.primaryColor,
        )} !important;`};
      `
        : `border: 1px solid ${Colors.DANGER_SOLID};`}
  }
  &&&&& .${Classes.DISABLED} {
    background-color: ${Colors.GREY_1};
    border: 1px solid ${Colors.GREY_3};
    .${Classes.BUTTON_TEXT} {
      color: ${Colors.GREY_7};
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
      !isEmptyOrNill(props.value) ? Colors.GREY_10 : Colors.GREY_6};
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
    }
  }
`;

export const DropdownStyles = createGlobalStyle<{
  dropDownWidth: number;
  id: string;
  borderRadius: string;
  primaryColor?: string;
}>`
${({ dropDownWidth, id }) => `
  .select-popover-width-${id} {
    width: ${dropDownWidth}px;

    & .${Classes.INPUT_GROUP} {
      width: ${dropDownWidth}px;
    }
  }
`}
  .select-popover-wrapper {
    box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
    border-radius: ${({ borderRadius }) =>
      borderRadius >= `1.5rem` ? `0.375rem` : borderRadius} !important;
    overflow: hidden;
    background: white;
    & .${Classes.INPUT_GROUP} {
      padding: 12px 12px 8px 12px;
      & > .${Classes.ICON} {
        &:first-child {
          left: 12px;
          top: 14px;
          margin: 9px;
          color: ${Colors.GREY_7};
          & > svg {
            width: 14px;
            height: 14px;
          }
        }
      }
      & > .${Classes.INPUT_ACTION} {
        &:last-child {
          right: 13px;
          top: 13px;
          .${Classes.BUTTON} {
            min-height: 34px;
            min-width: 35px;
            margin: 0px;
            color: ${Colors.GREY_6} !important;
            &:hover {
              color: ${Colors.GREY_10} !important;
              background: ${Colors.GREY_2};
              border-radius: 0;
            }
          }
        }
      }
      .${Classes.INPUT} {
        height: 32px;
        padding-left: 32px;
        border: 1px solid ${Colors.GREY_3};
        color: ${Colors.GREY_10};
        border-radius: ${({ borderRadius }) => borderRadius} !important;
        &:focus {
          border: ${({ primaryColor }) => `1px solid ${primaryColor}`};
          box-shadow: ${({ primaryColor }) =>
            `0px 0px 0px 3px ${lightenColor(primaryColor)} !important;`}
        }
      }
    }
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
        background: ${({ primaryColor }) => `${lightenColor(primaryColor)}`};
      }
      &.is-focused{
        background: ${({ primaryColor }) => `${lightenColor(primaryColor)}`};
      }
      &.${Classes.ACTIVE} {
        background: ${({ primaryColor }) => `${lightenColor(primaryColor)}`};
        color: ${Colors.GREY_10};
        position:relative;
      }
    }
  }
`;

export const DropdownContainer = styled.div<{ compactMode: boolean }>`
  ${BlueprintCSSTransform}
  display: flex;
  flex-direction: ${(props) => (props.compactMode ? "row" : "column")};
  height: 100%;
  align-items: center;
  justify-content: flex-end;
  gap: ${(props) => (props.compactMode ? "10px" : "5px")};

  label.bp3-label {
    margin: 0;
  }
`;
