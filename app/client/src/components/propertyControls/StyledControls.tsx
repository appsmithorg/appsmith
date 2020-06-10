import styled from "styled-components";
import { Select, MultiSelect } from "@blueprintjs/select";
import {
  Switch,
  InputGroup,
  Button,
  Classes,
  Popover,
  MenuItem,
  Menu,
} from "@blueprintjs/core";
import { DropdownOption } from "widgets/DropdownWidget";
import { ContainerOrientation } from "constants/WidgetConstants";
import { DateInput } from "@blueprintjs/datetime";
import { Colors } from "constants/Colors";
import { Skin } from "constants/DefaultTheme";

type ControlWrapperProps = {
  orientation?: ContainerOrientation;
  level?: number;
};

export const ControlWrapper = styled.div<ControlWrapperProps>`
  display: ${props => (props.orientation === "HORIZONTAL" ? "flex" : "block")};
  justify-content: space-between;
  align-items: center;
  flex-direction: ${props =>
    props.orientation === "VERTICAL" ? "column" : "row"};
  padding: ${props => props.theme.spaces[3]}px 0;
  padding-left: ${props => (props.level ? 18 * props.level : 0)}px;
  & > label {
    color: ${props => props.theme.colors.paneText};
    margin-bottom: ${props => props.theme.spaces[1]}px;
    font-size: ${props => props.theme.fontSizes[3]}px;
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
    color: ${props => props.theme.colors.paneText};
    margin-bottom: ${props => props.theme.spaces[1]}px;
    font-size: ${props => props.theme.fontSizes[3]}px;
  }
  .underline {
    color: ${props => props.theme.colors.paneTextUnderline};
  }
`;

export const JSToggleButton = styled.span<{ active: boolean }>`
  margin: 0 3px;
  cursor: pointer;
  height: 24px;
  svg {
    height: 24px;
    rect {
      fill: ${props =>
        props.active
          ? props.theme.colors.primary
          : props.theme.colors.paneIcon};
    }
  }
`;

export const StyledDropDownContainer = styled.div`
  &&&& .${Classes.BUTTON} {
    box-shadow: none;
    border-radius: 4px;
    background-color: ${Colors.SHARK};
    color: ${Colors.CADET_BLUE};
    background-image: none;
    &.code-highlight {
      .language-javascript {
        border: none;
        box-shadow: none;
        background: transparent;
      }
    }
  }
  &&&& .${Classes.MENU_ITEM} {
    border-radius: ${props => props.theme.radii[1]}px;
    &:hover {
      background: ${Colors.POLAR};
    }
    &.${Classes.ACTIVE} {
      background: ${Colors.POLAR};
      color: ${props => props.theme.colors.textDefault};
      position: relative;
      &.single-select {
        &:before {
          left: 0;
          top: -2px;
          position: absolute;
          content: "";
          background: ${props => props.theme.colors.primary};
          border-radius: 4px 0 0 4px;
          width: 4px;
          height: 100%;
        }
      }
    }
  }
  && .${Classes.POPOVER} {
    width: 100%;
    border-radius: ${props => props.theme.radii[1]}px;
    box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
    padding: ${props => props.theme.spaces[3]}px;
    background: white;
  }

  &&&& .${Classes.POPOVER_CONTENT} {
    box-shadow: none;
  }

  && .${Classes.POPOVER_WRAPPER} {
    .${Classes.OVERLAY} {
      .${Classes.TRANSITION_CONTAINER} {
        width: 100%;
      }
    }
  }
  && .${Classes.MENU} {
    max-width: 100%;
    max-height: auto;
  }
  width: 100%;
`;

export const StyledMenu = styled(Menu)`
  && {
    background: ${props => props.theme.dropdown[Skin.DARK].inActiveBG};
  }
  .bp3-submenu .bp3-menu {
    background: ${props => props.theme.dropdown[Skin.DARK].inActiveBG};
  }
`;

const DropDown = Select.ofType<DropdownOption>();
export const StyledDropDown = styled(DropDown)`
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
    border-radius: ${props => props.theme.radii[1]}px;
    background: ${props => props.theme.dropdown[Skin.DARK].inActiveBG};
    color: ${props => props.theme.dropdown[Skin.DARK].inActiveText};
    padding: 4px 8px;
    margin: 4px 0px;
    &:hover {
      background: ${props => props.theme.dropdown[Skin.DARK].hoverBG};
      &&&.bp3-menu-item.bp3-intent-danger:hover {
        background: ${props => props.theme.colors.error};
      }
    }
    &.${Classes.ACTIVE} {
      background: ${props => props.theme.dropdown[Skin.DARK].hoverBG};
      color: ${props => props.theme.dropdown[Skin.DARK].hoverText};
      position: relative;
      &.single-select {
        &:before {
          left: 0;
          top: -2px;
          position: absolute;
          content: "";
          background: ${props => props.theme.dropdown[Skin.DARK].hoverBG};
          border-radius: 4px 0 0 4px;
          width: 4px;
          height: 100%;
        }
      }
    }
    &&&& .${Classes.MENU} {
      background: ${props => props.theme.dropdown[Skin.DARK].inActiveBG};
    }
  }
`;

const MultiSelectDropDown = MultiSelect.ofType<DropdownOption>();
export const StyledMultiSelectDropDown = styled(MultiSelectDropDown)`
  &&& button {
    background: ${props => props.theme.colors.paneInputBG};
    color: ${props => props.theme.colors.textOnDarkBG};
    box-shadow: none;
  }
`;

export const StyledSwitch = styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${props => props.theme.colors.primary};
  }
`;

export const StyledDynamicInput = styled.div`
  width: 100%;
  &&& {
    input {
      border: none;
      color: ${props => props.theme.colors.textOnDarkBG};
      background: ${props => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${props => props.theme.colors.textOnDarkBG};
        background: ${props => props.theme.colors.paneInputBG};
      }
    }
  }
`;

export const StyledInputGroup = styled(InputGroup)`
  & > input {
    placeholder-text: ${props => props.placeholder};
    color: ${props => props.theme.colors.textOnDarkBG};
    background: ${props => props.theme.colors.paneInputBG};
  }
`;

export const StyledDatePicker = styled(DateInput)`
  > input {
    color: ${props => props.theme.colors.textOnDarkBG};
    background: ${props => props.theme.colors.paneInputBG};
    border: 1px solid green;
  }
`;

export const StyledPropertyPaneButton = styled(Button)`
  &&&& {
    background-color: ${props => props.theme.colors.info};
    color: #ffffff;
    .bp3-icon {
      color: #ffffff;
      margin-right: 4px;
    }
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

export const FieldWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const TreeStructureHorizontalWrapper = styled.div<{
  level: number;
  label: string;
}>`
  position: absolute;
  width: ${props => (props.level - 1) * 2 + 9}px;
  height: 2px;
  background: #a2a6a8;
  top: ${props => (props.label ? "65%" : "50%")};
  left: ${props => (props.level - 1) * 18 + 9}px;
  z-index: 1;
`;

export const TreeStructureVerticalWrapper = styled.div<{
  level: number;
  label: string;
  start: boolean;
}>`
  position: absolute;
  height: ${props => (props.start ? "77%" : "100%")};
  width: 2px;
  background: #a2a6a8;
  top: ${props =>
    props.start
      ? props.label
        ? "-12%"
        : "-16%"
      : props.label
      ? "-35%"
      : "-50%"};
  left: ${props => (props.level - 1) * 18 + 9}px;
  z-index: 1;
`;
