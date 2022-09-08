import React, { RefObject, useEffect, useRef } from "react";
import { Classes, MenuItem, Menu } from "@blueprintjs/core";
import { ContainerOrientation } from "constants/WidgetConstants";
import { DateRangeInput } from "@blueprintjs/datetime";
import { Colors } from "constants/Colors";
import styled, { Skin } from "constants/DefaultTheme";
import { AnyStyledComponent, css } from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { FormIcons } from "icons/FormIcons";
import {
  Button,
  Dropdown,
  InputWrapper,
  TextInput,
  TextInputProps,
} from "design-system";
import { IconWrapper } from "constants/IconConstants";
import useInteractionAnalyticsEvent from "utils/hooks/useInteractionAnalyticsEvent";
import { Checkbox } from "design-system";

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
  padding-top: 4px;
  &:not(:last-of-type) {
    padding-bottom: 4px;
  }
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
  &:focus-within .reset-button {
    display: block;
  }
`;

export const ControlPropertyLabelContainer = styled.div`
  display: flex;
  align-items: center;
  label {
    color: ${Colors.GRAY_700};
    margin-bottom: ${(props) => props.theme.spaces[1]}px;
    font-size: ${(props) => props.theme.fontSizes[3]}px;
  }
  .underline {
    color: ${(props) => props.theme.colors.paneTextUnderline};
  }
`;

export const JSToggleButton = styled.button<{ active: boolean }>`
  margin: 4px;
  margin-top: 0px;

  & ${IconWrapper} {
    cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  }

  height: auto;
  width: 28px;
  height: 16px;
  border: 0.5px solid
    ${(props) => (props.disabled ? Colors.GRAY_400 : Colors.GRAY_700)};
  background-color: ${(props) =>
    props.active
      ? props.disabled
        ? Colors.GRAY_400
        : Colors.GRAY_800
      : props.disabled
      ? Colors.GRAY_200
      : Colors.WHITE};

  &:hover {
    background-color: ${(props) =>
      props.disabled
        ? props.active
          ? Colors.GRAY_400
          : Colors.GRAY_200
        : props.active
        ? Colors.GRAY_900
        : Colors.GRAY_200};
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
      fill: ${(props) => (props.active ? Colors.WHITE : Colors.GRAY_700)};
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

const InputGroup = styled(TextInput)`
  width: 100%;
  border-radius: 0;
  background-color: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
  color: ${(props) => props.theme.colors.propertyPane.radioGroupText};
  &:focus {
    box-shadow: none;
  }
`;

const StyledInputWrapper = styled.div`
  width: 100%;

  &:focus ${InputWrapper} {
    border: 1px solid var(--appsmith-input-focus-border-color);
  }
`;

export const StyledInputGroup = React.forwardRef(
  (props: TextInputProps, ref) => {
    let inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLInputElement>(null);
    const { dispatchInteractionAnalyticsEvent } = useInteractionAnalyticsEvent<
      HTMLInputElement
    >(false, wrapperRef);

    if (ref) inputRef = ref as RefObject<HTMLInputElement>;

    useEffect(() => {
      window.addEventListener("keydown", handleKeydown);
      return () => {
        window.removeEventListener("keydown", handleKeydown);
      };
    }, []);

    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Enter":
        case " ":
          if (document.activeElement === wrapperRef?.current) {
            dispatchInteractionAnalyticsEvent({ key: e.key });
            inputRef?.current?.focus();
            e.preventDefault();
          }
          break;
        case "Escape":
          if (document.activeElement === inputRef?.current) {
            dispatchInteractionAnalyticsEvent({ key: e.key });
            wrapperRef?.current?.focus();
            e.preventDefault();
          }
          break;
        case "Tab":
          if (document.activeElement === wrapperRef?.current) {
            dispatchInteractionAnalyticsEvent({
              key: `${e.shiftKey ? "Shift+" : ""}${e.key}`,
            });
          }
          break;
      }
    };

    return (
      <StyledInputWrapper ref={wrapperRef} tabIndex={0}>
        <InputGroup ref={inputRef} {...props} tabIndex={-1} width="auto" />
      </StyledInputWrapper>
    );
  },
);

StyledInputGroup.displayName = "StyledInputGroup";

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

export const FlexWrapper = styled.div`
  display: flex;
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

  &:disabled {
    background-color: ${Colors.GREY_1};
    color: var(--appsmith-color-black-400);
    border-color: ${Colors.MERCURY};
  }
`;

export const StyledOptionControlInputGroup = styled(StyledInputGroup)<{
  rightPadding: number;
}>`
  width: 100%;
  padding-left: 20px;
  padding-right: ${(props) => props.rightPadding}px;
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

/* Used in Draggable List Card component in Property pane */
export const StyledActionContainer = styled.div`
  position: absolute;
  right: 0px;
  display: flex;
`;

const CommonIconStyles = css`
  padding: 0;
  margin-right: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

export const StyledEditIcon = styled(
  ControlIcons.SETTINGS_CONTROL as AnyStyledComponent,
)`
  ${CommonIconStyles}

  && svg {
    width: 16px;
    height: 16px;
    position: relative;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.iconColor};
    }
  }
`;

export const StyledVisibleIcon = styled(
  ControlIcons.SHOW_COLUMN as AnyStyledComponent,
)`
  ${CommonIconStyles}

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
  ${CommonIconStyles}

  && svg {
    width: 16px;
    height: 16px;
    position: relative;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.iconColor};
    }
  }
`;

export const StyledDeleteIcon = styled(
  FormIcons.DELETE_ICON as AnyStyledComponent,
)`
  ${CommonIconStyles}

  && svg {
    width: 16px;
    height: 16px;
    position: relative;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.iconColor};
    }
  }
`;

export const StyledCheckbox = styled(Checkbox)<{ disabled?: boolean }>`
  ${CommonIconStyles}
  cursor: ${(props) => (props.disabled ? "default" : "cursor")};
  width: 18px;
`;
