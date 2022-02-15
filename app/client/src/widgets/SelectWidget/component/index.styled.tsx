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
}>`
  div {
    flex: 1 1 auto;
  }
  span {
    width: 100%;
    position: relative;

    & > div {
      height: 100%;
      overflow: hidden;
    }
  }
  &&&& .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: space-between;
    box-shadow: none;
    background: white;
    min-height: 36px;
    padding-left: 12px;
    border: 1.2px solid
      ${(props) => (props.hasError ? Colors.DANGER_SOLID : Colors.GREY_3)};
    ${(props) =>
      props.isValid
        ? `
        &:hover {
          border: 1.2px solid ${Colors.GREY_5};
        }
        &:focus {
          border: 1.2px solid ${Colors.GREEN_SOLID};
          outline: 0;
        }
      `
        : ""};
  }

  &&&&& .${Classes.POPOVER_OPEN} .${Classes.BUTTON} {
    outline: 0;
    ${(props) =>
      !props.hasError
        ? `
        border: 1.2px solid ${Colors.GREEN_SOLID};
        box-shadow: 0px 0px 0px 2px ${Colors.GREEN_SOLID_HOVER};
      `
        : `border: 1.2px solid ${Colors.DANGER_SOLID};`}
  }
  &&&&& .${Classes.DISABLED} {
    background-color: ${Colors.GREY_1};
    border: 1.2px solid ${Colors.GREY_3};
    .${Classes.BUTTON_TEXT} {
      color: ${Colors.GREY_7};
    }
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    color: ${(props) => (props.value ? Colors.GREY_10 : Colors.GREY_6)};
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
    }
  }
`;

export const DropdownStyles = createGlobalStyle<{
  parentWidth: number;
  dropDownWidth: number;
  id: string;
}>`
${({ dropDownWidth, id, parentWidth }) => `
  .select-popover-width-${id} {
    min-width: ${parentWidth > dropDownWidth ? parentWidth : dropDownWidth}px;

    & .${Classes.INPUT_GROUP} {
       width: ${parentWidth > dropDownWidth ? parentWidth : dropDownWidth}px;
    }
  }
`}
  .select-popover-wrapper {
    width: auto;
    box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
    border-radius: 0;
    background: white;

    & .${Classes.INPUT_GROUP} {
      padding: 12px 12px 8px 12px;
      min-width: 180px;

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
        height: 36px;
        border: 1.2px solid ${Colors.GREY_3};
        color: ${Colors.GREY_10};
        &:focus {
          border: 1.2px solid ${Colors.GREEN_SOLID};
          box-shadow: 0px 0px 0px 2px ${Colors.GREEN_SOLID_HOVER};
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
      color: ${Colors.GREY_8};
      &:hover{
        background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
      }
      &.is-focused{
        background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
      }
      &.${Classes.ACTIVE} {
        background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
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
  align-items: ${(props) => (props.compactMode ? "center" : "left")};

  label.select-label {
    margin-bottom: ${(props) => (props.compactMode ? "0px" : "5px")};
    margin-right: ${(props) => (props.compactMode ? "10px" : "0px")};
  }
`;
