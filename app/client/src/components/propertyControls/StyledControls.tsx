import { Classes, Popover, MenuItem, Menu } from "@blueprintjs/core";
import { ContainerOrientation } from "constants/WidgetConstants";
import { DateRangeInput } from "@blueprintjs/datetime";
import { Colors } from "constants/Colors";
import styled, { Skin } from "constants/DefaultTheme";
import { AnyStyledComponent } from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
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
  border-radius: 4px;
  height: auto;
  width: 28px;
  height: 16px;
  border: 0.5px solid
    ${(props) => props.theme.colors.propertyPane.activeButtonText};
  background-color: ${(props) =>
    props.active
      ? props.theme.colors.propertyPane.activeButtonText
      : props.theme.colors.propertyPane.buttonText};

  &:hover {
    background-color: ${(props) =>
      props.theme.colors.propertyPane.jsButtonHoverBG};

    &&& svg {
      path {
        fill: ${(props) =>
          props.active
            ? props.theme.colors.propertyPane.activeButtonText
            : props.theme.colors.propertyPane.activeButtonText};
      }
    }
  }

  & > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &&& svg {
    width: 28px;
    height: 16px;
    transform: scale(1.6);

    rect {
      fill: transparent;
    }

    path {
      fill: ${(props) =>
        props.active
          ? props.theme.colors.WHITE
          : props.theme.colors.propertyPane.activeButtonText};
    }
  }
`;

export const StyledDropDownContainer = styled.div`
  width: 100%;
`;

export const StyledDropDown = styled(Dropdown)`
  height: auto;
  background-color: ${(props) => props.theme.colors.propertyPane.buttonText};
  box-shadow: none;
`;

export const StyledMultiSelectDropDown = styled(MultiSelectDropdown)`
  height: auto;
  background-color: ${(props) => props.theme.colors.propertyPane.buttonText};
`;

export const StyledMenu = styled(Menu)`
  && {
    background: ${(props) => props.theme.dropdown[Skin.DARK].background};
    border-radius: unset;
  }
  .bp3-submenu .bp3-menu {
    background: ${(props) => props.theme.dropdown[Skin.DARK].background};
  }
`;

export const StyledPopover = styled(Popover)`
  .${Classes.POPOVER_TARGET} {
    display: flex;
  }
  div {
    flex: 1 1 auto;
  }
  span {
    width: 100%;
    position: relative;
  }
  .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
    }
  }
`;

export const StyledMenuItem = styled(MenuItem)`
  &&&&&& {
    border-radius: ${(props) => props.theme.radii[1]}px;
    background: ${(props) => props.theme.dropdown[Skin.DARK].background};
    color: ${(props) => props.theme.dropdown[Skin.DARK].inActiveText};
    padding: 4px 8px;
    margin: 4px 0px;
    &:hover {
      background: ${(props) => props.theme.dropdown[Skin.DARK].hoverBG};
      &&&.bp3-menu-item.bp3-intent-danger:hover {
        background: ${(props) => props.theme.colors.error};
      }
    }
    &.${Classes.ACTIVE} {
      background: ${(props) => props.theme.dropdown[Skin.DARK].hoverBG};
      color: ${(props) => props.theme.dropdown[Skin.DARK].hoverText};
      position: relative;
      &.single-select {
        &:before {
          left: 0;
          top: -2px;
          position: absolute;
          content: "";
          background: ${(props) => props.theme.dropdown[Skin.DARK].hoverBG};
          border-radius: 4px 0 0 4px;
          width: 4px;
          height: 100%;
        }
      }
    }
    &&&& .${Classes.MENU} {
      background: ${(props) => props.theme.dropdown[Skin.DARK].inActiveBG};
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
  border-radius: 4px;
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
  right: 35px;
  && svg {
    width: 12px;
    height: 12px;
    position: relative;
    top: 2px;
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
  ControlIcons.DELETE_COLUMN as AnyStyledComponent,
)`
  padding: 0;
  position: absolute;
  margin-left: 15px;
  cursor: pointer;
  right: ${(props) => props.marginRight ?? 12}px;
  && svg {
    width: 24px;
    height: 24px;
    top: -2px;
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
  right: ${(props) => props.marginRight ?? 12}px;
  && svg {
    width: 24px;
    height: 24px;
    top: -2px;
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
  && svg {
    width: 14px;
    top: 3px;
    height: 14px;
    left: 3px;
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

  &,
  &:active,
  &:hover {
    border-color: transparent;
    color: ${(props) => props.theme.colors.propertyPane.buttonText};
    background-color: ${(props) => props.theme.colors.propertyPane.buttonBg};
  }

  &&& svg {
    width: 14px;
    height: 14px;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.buttonText};
      stroke: ${(props) => props.theme.colors.propertyPane.buttonText};
    }
  }
`;
