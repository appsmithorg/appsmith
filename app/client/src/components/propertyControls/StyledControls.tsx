import { Classes, MenuItem, Menu } from "@blueprintjs/core";
import { ContainerOrientation } from "constants/WidgetConstants";
import { DateRangeInput } from "@blueprintjs/datetime";
import { Colors } from "constants/Colors";
import styled, { Skin } from "constants/DefaultTheme";
import { AnyStyledComponent } from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { FormIcons } from "icons/FormIcons";
import Button from "components/ads/Button";
import TextInput from "components/ads/TextInput";
import Dropdown from "components/ads/Dropdown";
import MultiSelectDropdown from "components/ads/MultiselectDropdown";

type ControlWrapperProps = {
  orientation?: ContainerOrientation;
  isAction?: boolean;
};

export const ControlWrapper = styled.div<ControlWrapperProps>`
  display: ${(props) =>
    props.orientation === "HORIZONTAL" ? "flex" : "block"};
  justify-content: space-between;
  align-items: center;
  flex-direction: ${(props) =>
    props.orientation === "VERTICAL" ? "column" : "row"};
  padding: ${(props) => (props.isAction ? "0" : "4px 0 ")};
  & > label {
    color: ${(props) => props.theme.colors.propertyPane.label};
    margin-bottom: ${(props) => props.theme.spaces[1]}px;
    font-size: ${(props) => props.theme.fontSizes[3]}px;
  }
  &&& > label:first-of-type {
    display: block;
  }
  &&& > label {
    display: inline-block;
  }
`;

export const ControlPropertyLabelContainer = styled.div`
  display: flex;
  align-items: center;
  label {
    color: ${(props) => props.theme.colors.propertyPane.label};
    margin-bottom: ${(props) => props.theme.spaces[1]}px;
    font-size: ${(props) => props.theme.fontSizes[3]}px;
  }
  .underline {
    color: ${(props) => props.theme.colors.paneTextUnderline};
  }
`;

export const JSToggleButton = styled.span<{ active: boolean }>`
  margin: 4px;
  margin-top: 0px;
  cursor: pointer;
  height: auto;
  width: 28px;
  height: 16px;
  border: 0.5px solid ${Colors.BLACK};
  background-color: ${(props) =>
    props.active ? Colors.GREY_10 : Colors.GREY_2};

  &:hover {
    background-color: ${(props) =>
      props.active ? Colors.GREY_9 : Colors.GREY_3};

    &&& svg {
      path {
        fill: ${(props) => (props.active ? Colors.GREY_2 : Colors.GREY_9)};
      }
    }
  }

  & > div {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  &&& svg {
    width: 28px;
    height: 16px;
    transform: scale(1.4);

    rect {
      fill: transparent;
    }

    path {
      fill: ${(props) =>
        props.active ? props.theme.colors.GREY_2 : Colors.GREY_9};
    }
  }
`;

export const StyledDropDownContainer = styled.div`
  width: 100%;
  height: 100%;
`;

export const StyledDropDown = styled(Dropdown)`
  background-color: ${(props) => props.theme.colors.propertyPane.buttonText};
  box-shadow: none;
  height: 36px;
`;

export const StyledMultiSelectDropDown = styled(MultiSelectDropdown)`
  background-color: ${(props) => props.theme.colors.propertyPane.buttonText};
`;

export const StyledMenu = styled(Menu)`
  && {
    background: ${(props) => props.theme.dropdown[Skin.LIGHT].background};
    border-radius: unset;
  }
  .bp3-submenu .bp3-menu {
    background: ${(props) => props.theme.dropdown[Skin.LIGHT].background};
  }
`;

export const StyledMenuItem = styled(MenuItem)`
  &&&&&& {
    border-radius: 0;
    background: ${(props) => props.theme.dropdown[Skin.LIGHT].background};
    color: ${(props) => props.theme.dropdown[Skin.LIGHT].inActiveText};
    padding: 4px 8px;
    margin: 4px 0px;
    &:hover {
      background: ${(props) => props.theme.dropdown[Skin.LIGHT].hoverBG};
      &&&.bp3-menu-item.bp3-intent-danger:hover {
        color: ${(props) => props.theme.colors.error};
      }
    }
    &.${Classes.ACTIVE} {
      background: ${(props) => props.theme.dropdown[Skin.LIGHT].hoverBG};
      position: relative;
      &.single-select {
        &:before {
          left: 0;
          top: -2px;
          position: absolute;
          content: "";
          background: ${(props) => props.theme.dropdown[Skin.LIGHT].hoverBG};
          border-radius: 0;
          width: 4px;
          height: 100%;
        }
      }
    }
    &&&& .${Classes.MENU} {
      background: ${(props) => props.theme.dropdown[Skin.LIGHT].inActiveBG};
    }
  }
`;

export const StyledDynamicInput = styled.div`
  width: 100%;
  &&& {
    input {
      border: none;
      color: ${(props) => props.theme.colors.textOnDarkBG};
      background: ${(props) => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
        background: ${(props) => props.theme.colors.paneInputBG};
      }
    }
  }
`;

export const StyledInputGroup = styled(TextInput)`
  width: 100%;
  border-radius: 0;
  background-color: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
  color: ${(props) => props.theme.colors.propertyPane.radioGroupText};
  &:focus {
    box-shadow: none;
  }
`;

export const StyledDateRangePicker = styled(DateRangeInput)`
  > input {
    color: ${(props) => props.theme.colors.textOnDarkBG};
    background: ${(props) => props.theme.colors.paneInputBG};
    border: 1px solid green;
  }
`;

export const FieldWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const StyledEditIcon = styled(
  ControlIcons.SETTINGS_CONTROL as AnyStyledComponent,
)`
  padding: 0;
  position: absolute;
  margin-left: 0;
  cursor: pointer;
  right: 40px;
  display: flex;
  align-items: center;
  && svg {
    width: 16px;
    height: 16px;
    position: relative;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.iconColor};
    }
  }
`;

export const StyledDragIcon = styled(
  ControlIcons.DRAG_CONTROL as AnyStyledComponent,
)`
  padding: 0;
  position: absolute;
  margin-right: 15px;
  cursor: move;
  z-index: 1;
  left: 4px;
  && svg {
    width: 16px;
    height: 16px;
    position: relative;
    top: 2px;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.iconColor};
    }
  }
`;

export const StyledDeleteIcon = styled(
  FormIcons.DELETE_ICON as AnyStyledComponent,
)`
  padding: 0;
  position: absolute;
  margin-left: 15px;
  cursor: pointer;
  right: ${(props) => props.marginRight ?? 12}px;
  display: flex;
  align-items: center;

  && svg {
    width: 16px;
    height: 16px;
    position: relative;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.iconColor};
    }
  }
`;

export const FlexWrapper = styled.div`
  display: flex;
`;

export const StyledVisibleIcon = styled(
  ControlIcons.SHOW_COLUMN as AnyStyledComponent,
)`
  padding: 0;
  position: absolute;
  margin-left: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  right: ${(props) => props.marginRight ?? 12}px;
  && svg {
    width: 16px;
    height: 16px;
    position: relative;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.iconColor};
    }
  }
`;

export const StyledHiddenIcon = styled(
  ControlIcons.HIDE_COLUMN as AnyStyledComponent,
)`
  padding: 0;
  position: absolute;
  margin-left: 15px;
  cursor: pointer;
  right: ${(props) => props.marginRight ?? 12}px;
  display: flex;
  align-items: center;
  && svg {
    width: 16px;
    height: 16px;
    position: relative;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.iconColor};
    }
  }
`;

export const StyledPropertyPaneButton = styled(Button)`
  margin-top: 4px;
  margin-left: auto;
  display: flex;
  justify-content: flex-end;
  border: 1px solid ${Colors.GREY_8};

  &,
  &:active {
    border: 1px solid ${Colors.GREY_8};
    color: ${Colors.GREY_8};
    background-color: transparent;
  }

  &:hover {
    border: 1px solid ${Colors.GREY_8};
    color: ${Colors.GREY_8};
    background-color: ${Colors};
  }

  &&& svg {
    width: 14px;
    height: 14px;
    path {
      fill: ${Colors.GREY_8};
      stroke: ${Colors.GREY_8};
    }
  }
`;

export const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  width: 100%;
  padding-left: 20px;
  padding-right: 60px;
  padding-bottom: 4px;
  text-overflow: ellipsis;
  background: inherit;
  &&& {
    input {
      padding-left: 24px;
      border: none;
      color: ${(props) => props.theme.colors.textOnDarkBG};
      &:focus {
        border: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }
  }
`;
