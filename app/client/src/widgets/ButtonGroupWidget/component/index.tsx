import React, { RefObject, createRef } from "react";
import { sortBy } from "lodash";
import {
  Alignment,
  Icon,
  Menu,
  MenuItem,
  Classes as CoreClass,
} from "@blueprintjs/core";
import { Classes, Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";
import tinycolor from "tinycolor2";
import { darkenActive, darkenHover } from "constants/DefaultTheme";
import {
  ButtonBoxShadow,
  ButtonBoxShadowTypes,
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
  ButtonStyleType,
  ButtonVariant,
  ButtonVariantTypes,
  ButtonPlacement,
} from "components/constants";
import { ThemeProp } from "components/ads/common";
import styled, { createGlobalStyle } from "styled-components";
import { Colors } from "constants/Colors";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomTextColor,
  getCustomJustifyContent,
} from "widgets/WidgetUtils";
import { RenderMode, RenderModes } from "constants/WidgetConstants";
import { DragContainer } from "widgets/ButtonWidget/component/DragContainer";
import { buttonHoverActiveStyles } from "../../ButtonWidget/component/utils";

// Utility functions
interface ButtonData {
  id?: string;
  type?: string;
  label?: string;
  iconName?: string;
}
// Extract props influencing to width change
const getButtonData = (
  groupButtons: Record<string, GroupButtonProps>,
): ButtonData[] => {
  const buttonData = Object.keys(groupButtons).reduce(
    (acc: ButtonData[], id) => {
      return [
        ...acc,
        {
          id,
          type: groupButtons[id].buttonType,
          label: groupButtons[id].label,
          iconName: groupButtons[id].iconName,
        },
      ];
    },
    [],
  );

  return buttonData as ButtonData[];
};

interface WrapperStyleProps {
  isHorizontal: boolean;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
}

const ButtonGroupWrapper = styled.div<ThemeProp & WrapperStyleProps>`
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  overflow: hidden;

  ${(props) =>
    props.isHorizontal ? "flex-direction: row" : "flex-direction: column"};

  border-radius: ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.ROUNDED
      ? "8px"
      : borderRadius === ButtonBorderRadiusTypes.CIRCLE
      ? "32px"
      : "0px"};

  box-shadow: ${({ boxShadow, boxShadowColor, theme }) =>
    boxShadow === ButtonBoxShadowTypes.VARIANT1
      ? `0px 0px 4px 3px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant1}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT2
      ? `3px 3px 4px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant2}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT3
      ? `0px 1px 3px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant3}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT4
      ? `2px 2px 0px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant4}`
      : boxShadow === ButtonBoxShadowTypes.VARIANT5
      ? `-2px -2px 0px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant5}`
      : "none"} !important;
`;

const MenuButtonWrapper = styled.div<{ renderMode: RenderMode }>`
  flex: 1 1 auto;

  ${({ renderMode }) => renderMode === RenderModes.CANVAS && `height: 100%`};

  & > .${Classes.POPOVER2_TARGET} > button {
    width: 100%;
    height: 100%;
  }

  & > .${Classes.POPOVER2_TARGET} {
    height: 100%;
  }
`;

const PopoverStyles = createGlobalStyle<{
  minPopoverWidth: number;
  popoverTargetWidth?: number;
  id: string;
}>`
  .menu-button-popover > .${Classes.POPOVER2_CONTENT} {
    background: none;
  }
  ${({ id, minPopoverWidth, popoverTargetWidth }) => `
    .menu-button-width-${id} {
      ${popoverTargetWidth && `width: ${popoverTargetWidth}px`};
      min-width: ${minPopoverWidth}px;
    }
  `}
`;

interface ButtonStyleProps {
  isHorizontal: boolean;
  borderRadius?: ButtonBorderRadius;
  borderRadOnStart: boolean;
  borderRadOnEnd: boolean;
  buttonVariant?: ButtonVariant; // solid | outline | ghost
  buttonColor?: string;
  iconAlign?: string;
  placement?: ButtonPlacement;
  isLabel: boolean;
}

/*
  Don't use buttonHoverActiveStyles in a nested function it won't work - 

  const buttonHoverActiveStyles = css ``

  const Button = styled.button`
  // won't work
    ${({ buttonColor, theme }) => {
      &:hover, &:active {
        ${buttonHoverActiveStyles}
      }
    }}

  // will work
  &:hover, &:active {
    ${buttonHoverActiveStyles}
  }`
*/

const StyledButton = styled.button<ThemeProp & ButtonStyleProps>`
  flex: 1 1 auto;
  display: flex;
  justify-content: stretch;
  align-items: center;
  padding: 0px 10px;

  &:hover,
  &:active {
    ${buttonHoverActiveStyles}
  }

  ${({
    borderRadius,
    borderRadOnEnd,
    borderRadOnStart,
    buttonColor,
    buttonVariant,
    iconAlign,
    isHorizontal,
    isLabel,
    theme,
  }) => `
    & {
      background: ${
        getCustomBackgroundColor(buttonVariant, buttonColor) !== "none"
          ? getCustomBackgroundColor(buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.PRIMARY
          ? theme.colors.button.primary.primary.bgColor
          : "none"
      } !important;
      flex-direction : ${iconAlign === "right" ? "row-reverse" : "row"};
      .bp3-icon {
        ${
          isLabel
            ? iconAlign === "right"
              ? "margin-left: 10px"
              : "margin-right: 10px"
            : ""
        };
      }
    }


    border: ${
      getCustomBorderColor(buttonVariant, buttonColor) !== "none"
        ? `1px solid ${getCustomBorderColor(buttonVariant, buttonColor)}`
        : buttonVariant === ButtonVariantTypes.SECONDARY
        ? `1px solid ${theme.colors.button.primary.secondary.borderColor}`
        : "none"
    } ${buttonVariant === ButtonVariantTypes.PRIMARY ? "" : "!important"};

    ${
      isHorizontal
        ? buttonVariant === ButtonVariantTypes.PRIMARY
          ? borderRadOnEnd
            ? ""
            : `
            border-right: 1px solid ${getCustomTextColor(theme, buttonColor)};
          `
          : ""
        : buttonVariant === ButtonVariantTypes.PRIMARY
        ? borderRadOnEnd
          ? ""
          : `
          border-bottom: 1px solid ${getCustomTextColor(theme, buttonColor)};
        `
        : ""
    }

    border-radius: ${
      borderRadius === ButtonBorderRadiusTypes.ROUNDED
        ? borderRadOnStart // first button
          ? isHorizontal
            ? "8px 0px 0px 8px"
            : "8px 8px 0px 0px"
          : borderRadOnEnd // last button
          ? isHorizontal
            ? "0px 8px 8px 0px"
            : "0px 0px 8px 8px"
          : "0px"
        : borderRadius === ButtonBorderRadiusTypes.CIRCLE
        ? borderRadOnStart // first button
          ? isHorizontal
            ? "32px 0px 0px 32px"
            : "32px 32px 0px 0px"
          : borderRadOnEnd // last button
          ? isHorizontal
            ? "0px 32px 32px 0px"
            : "0px 0px 32px 32px"
          : "0px"
        : "0px"
    };

    & span {
      color: ${
        buttonVariant === ButtonVariantTypes.PRIMARY
          ? getCustomTextColor(theme, buttonColor)
          : getCustomBackgroundColor(ButtonVariantTypes.PRIMARY, buttonColor)
      } !important;
    }

    &:disabled { 
      cursor: not-allowed;
      border: 1px solid ${Colors.ALTO2} !important;
      background: ${theme.colors.button.disabled.bgColor} !important;
      span {
        color: ${theme.colors.button.disabled.textColor} !important;
      }
    }
  `}
`;

const StyledButtonContent = styled.div<{
  iconAlign: string;
  placement?: ButtonPlacement;
}>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: ${({ placement }) => getCustomJustifyContent(placement)};
  flex-direction: ${({ iconAlign }) =>
    iconAlign === Alignment.RIGHT ? "row-reverse" : "row"};
`;

export interface BaseStyleProps {
  backgroundColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  buttonColor?: string;
  buttonStyle?: ButtonStyleType;
  buttonVariant?: ButtonVariant;
  textColor?: string;
}

const BaseMenuItem = styled(MenuItem)<ThemeProp & BaseStyleProps>`
  padding: 8px 10px !important;
  ${({ backgroundColor, theme }) =>
    backgroundColor
      ? `
      background-color: ${backgroundColor} !important;
      &:hover {
        background-color: ${darkenHover(backgroundColor)} !important;
      }
      &:active {
        background-color: ${darkenActive(backgroundColor)} !important;
      }
  `
      : `
    background: none !important
      &:hover {
        background-color: ${tinycolor(
          theme.colors.button.primary.primary.textColor,
        )
          .darken()
          .toString()} !important;
      }
      &:active {
        background-color: ${tinycolor(
          theme.colors.button.primary.primary.textColor,
        )
          .darken()
          .toString()} !important;
      }
    `}
  ${({ textColor }) =>
    textColor &&
    `
      color: ${textColor} !important;
  `}
`;

const StyledMenu = styled(Menu)`
  padding: 0;
  min-width: 0px;
`;

interface PopoverContentProps {
  menuItems: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
      onClick?: string;
    }
  >;
  onItemClicked: (onClick: string | undefined) => void;
}

function PopoverContent(props: PopoverContentProps) {
  const { menuItems, onItemClicked } = props;

  let items = Object.keys(menuItems)
    .map((itemKey) => menuItems[itemKey])
    .filter((item) => item.isVisible === true);
  // sort btns by index
  items = sortBy(items, ["index"]);

  const listItems = items.map((menuItem) => {
    const {
      backgroundColor,
      iconAlign,
      iconColor,
      iconName,
      id,
      isDisabled,
      label,
      onClick,
      textColor,
    } = menuItem;
    if (iconAlign === Alignment.RIGHT) {
      return (
        <BaseMenuItem
          backgroundColor={backgroundColor}
          disabled={isDisabled}
          key={id}
          labelElement={<Icon color={iconColor} icon={iconName} />}
          onClick={() => onItemClicked(onClick)}
          text={label}
          textColor={textColor}
        />
      );
    }
    return (
      <BaseMenuItem
        backgroundColor={backgroundColor}
        disabled={isDisabled}
        icon={<Icon color={iconColor} icon={iconName} />}
        key={id}
        onClick={() => onItemClicked(onClick)}
        text={label}
        textColor={textColor}
      />
    );
  });

  return <StyledMenu>{listItems}</StyledMenu>;
}

class ButtonGroupComponent extends React.Component<
  ButtonGroupComponentProps,
  ButtonGroupComponentState
> {
  private timer?: number;

  constructor(props: ButtonGroupComponentProps) {
    super(props);
    this.state = {
      itemRefs: {},
      itemWidths: {},
    };
  }

  componentDidMount() {
    this.setState(() => {
      return {
        ...this.state,
        itemRefs: this.createMenuButtonRefs(),
      };
    });

    this.timer = setTimeout(() => {
      this.setState(() => {
        return {
          ...this.state,
          itemWidths: this.getMenuButtonWidths(),
        };
      });
    }, 0);
  }

  componentDidUpdate(
    prevProps: ButtonGroupComponentProps,
    prevState: ButtonGroupComponentState,
  ) {
    if (
      this.state.itemRefs !== prevState.itemRefs ||
      this.props.width !== prevProps.width ||
      this.props.orientation !== prevProps.orientation
    ) {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.setState(() => {
          return {
            ...this.state,
            itemWidths: this.getMenuButtonWidths(),
          };
        });
      });
    } else {
      // Reset refs array if
      // * A button is added/removed or changed into a menu button
      // * A label is changed or icon is newly added or removed
      let isWidthChanged = false;
      const buttons = getButtonData(this.props.groupButtons);
      const menuButtons = buttons.filter((button) => button.type === "MENU");
      const prevButtons = getButtonData(prevProps.groupButtons);
      const prevMenuButtons = prevButtons.filter(
        (button) => button.type === "MENU",
      );

      if (buttons.length !== prevButtons.length) {
        isWidthChanged = true;
      } else if (menuButtons.length > prevMenuButtons.length) {
        isWidthChanged = true;
      } else {
        isWidthChanged = buttons.some((button) => {
          const prevButton = prevButtons.find((btn) => btn.id === button.id);

          return (
            button.label !== prevButton?.label ||
            (button.iconName && !prevButton?.iconName) ||
            (!button.iconName && prevButton?.iconName)
          );
        });
      }

      if (isWidthChanged) {
        this.setState(() => {
          return {
            ...this.state,
            itemRefs: this.createMenuButtonRefs(),
          };
        });
      }
    }
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  // Get widths of menu buttons
  getMenuButtonWidths = () =>
    Object.keys(this.props.groupButtons).reduce((acc, id) => {
      if (this.props.groupButtons[id].buttonType === "MENU") {
        return {
          ...acc,
          [id]: this.state.itemRefs[id].current?.getBoundingClientRect().width,
        };
      }
      return acc;
    }, {});

  // Create refs of menu buttons
  createMenuButtonRefs = () =>
    Object.keys(this.props.groupButtons).reduce((acc, id) => {
      if (this.props.groupButtons[id].buttonType === "MENU") {
        return {
          ...acc,
          [id]: createRef(),
        };
      }
      return acc;
    }, {});

  onButtonClick = (onClick: string | undefined) => {
    this.props.buttonClickHandler(onClick);
  };

  render = () => {
    const {
      buttonVariant,
      groupButtons,
      isDisabled,
      minPopoverWidth,
      orientation,
      widgetId,
    } = this.props;
    const isHorizontal = orientation === "horizontal";

    let items = Object.keys(groupButtons)
      .map((itemKey) => groupButtons[itemKey])
      .filter((item) => item.isVisible === true);
    // sort btns by index
    items = sortBy(items, ["index"]);

    return (
      <ButtonGroupWrapper
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        boxShadowColor={this.props.boxShadowColor}
        className="t--buttongroup-widget"
        isHorizontal={isHorizontal}
      >
        {items.map((button) => {
          const borderRadOnStart = button.index === 0;
          const borderRadOnEnd = button.index === items.length - 1;
          const isButtonDisabled = button.isDisabled || isDisabled;

          if (button.buttonType === "MENU" && !isButtonDisabled) {
            const { menuItems } = button;
            const popoverId = `${widgetId}-${button.id}`;
            return (
              <MenuButtonWrapper
                key={button.id}
                renderMode={this.props.renderMode}
              >
                <PopoverStyles
                  id={popoverId}
                  minPopoverWidth={minPopoverWidth}
                  popoverTargetWidth={this.state.itemWidths[button.id]}
                />
                <Popover2
                  content={
                    <PopoverContent
                      menuItems={menuItems || {}}
                      onItemClicked={this.onButtonClick}
                    />
                  }
                  disabled={button.isDisabled}
                  fill
                  minimal
                  placement="bottom-end"
                  popoverClassName={`menu-button-popover menu-button-width-${popoverId}`}
                >
                  <DragContainer
                    buttonColor={button.buttonColor}
                    buttonVariant={buttonVariant}
                    disabled={isButtonDisabled}
                    renderMode={this.props.renderMode}
                  >
                    <StyledButton
                      borderRadOnEnd={borderRadOnEnd}
                      borderRadOnStart={borderRadOnStart}
                      borderRadius={this.props.borderRadius}
                      buttonColor={button.buttonColor}
                      buttonVariant={buttonVariant}
                      disabled={isButtonDisabled}
                      iconAlign={button.iconAlign}
                      isHorizontal={isHorizontal}
                      isLabel={!!button.label}
                      key={button.id}
                      ref={this.state.itemRefs[button.id]}
                    >
                      <StyledButtonContent
                        iconAlign={button.iconAlign || "left"}
                        placement={button.placement}
                      >
                        {button.iconName && <Icon icon={button.iconName} />}
                        {!!button.label && (
                          <span className={CoreClass.BUTTON_TEXT}>
                            {button.label}
                          </span>
                        )}
                      </StyledButtonContent>
                    </StyledButton>
                  </DragContainer>
                </Popover2>
              </MenuButtonWrapper>
            );
          }
          return (
            <DragContainer
              buttonColor={button.buttonColor}
              buttonVariant={buttonVariant}
              disabled={isButtonDisabled}
              key={button.id}
              onClick={() => {
                this.onButtonClick(button.onClick);
              }}
              renderMode={this.props.renderMode}
              style={{ flex: "1 1 auto" }}
            >
              <StyledButton
                borderRadOnEnd={borderRadOnEnd}
                borderRadOnStart={borderRadOnStart}
                borderRadius={this.props.borderRadius}
                buttonColor={button.buttonColor}
                buttonVariant={buttonVariant}
                disabled={isButtonDisabled}
                iconAlign={button.iconAlign}
                isHorizontal={isHorizontal}
                isLabel={!!button.label}
                onClick={() => this.onButtonClick(button.onClick)}
              >
                <StyledButtonContent
                  iconAlign={button.iconAlign || "left"}
                  placement={button.placement}
                >
                  {button.iconName && <Icon icon={button.iconName} />}
                  {!!button.label && (
                    <span className={CoreClass.BUTTON_TEXT}>
                      {button.label}
                    </span>
                  )}
                </StyledButtonContent>
              </StyledButton>
            </DragContainer>
          );
        })}
      </ButtonGroupWrapper>
    );
  };
}

interface GroupButtonProps {
  widgetId: string;
  id: string;
  index: number;
  isVisible?: boolean;
  isDisabled?: boolean;
  label?: string;
  buttonType?: string;
  buttonColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
  onClick?: string;
  menuItems: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
      onClick?: string;
    }
  >;
}

export interface ButtonGroupComponentProps {
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  buttonVariant: ButtonVariant;
  buttonClickHandler: (onClick: string | undefined) => void;
  groupButtons: Record<string, GroupButtonProps>;
  isDisabled: boolean;
  orientation: string;
  renderMode: RenderMode;
  width: number;
  minPopoverWidth: number;
  widgetId: string;
}

export interface ButtonGroupComponentState {
  itemRefs: Record<string, RefObject<HTMLButtonElement>>;
  itemWidths: Record<string, number>;
}

export default ButtonGroupComponent;
