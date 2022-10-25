import * as React from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Alignment,
  Button,
  Classes as CoreClasses,
  Icon,
  Menu,
  MenuItem,
  Classes as BClasses,
} from "@blueprintjs/core";
import { Classes, Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";
import { darkenActive, darkenHover } from "constants/DefaultTheme";
import {
  ButtonPlacement,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomHoverColor,
  getComplementaryGrayscaleColor,
  getCustomJustifyContent,
  WidgetContainerDiff,
  lightenColor,
} from "widgets/WidgetUtils";
import { ThemeProp } from "components/ads/common";
import { MenuItems } from "../Constants";
import tinycolor from "tinycolor2";
import { Colors } from "constants/Colors";
import orderBy from "lodash/orderBy";
import { isArray } from "lodash";
import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import { MenuItemsSource } from "widgets/MenuButtonWidget/constants";
import {
  getBooleanPropertyValue,
  getPropertyValue,
} from "widgets/TableWidgetV2/widget/utilities";

const MenuButtonContainer = styled.div`
  width: 100%;
  height: 100%;
  text-align: center;

  & > .${Classes.POPOVER2_TARGET} {
    height: 100%;
  }
`;

const PopoverStyles = createGlobalStyle<{
  parentWidth: number;
  menuDropDownWidth: number;
  borderRadius: string;
  accentColor: string;
}>`
  .table-menu-button-popover {
     box-shadow: none;
     & > .${Classes.POPOVER2_CONTENT} {
      background: none;
      box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
      margin-top: 8px !important;
      border-radius: ${({ borderRadius }) =>
        borderRadius >= `1.5rem` ? `0.375rem` : borderRadius};
      overflow: hidden;
    }
    & .${BClasses.MENU_ITEM} {
      padding: 9px 12px;
      border-radius: 0;
      &:hover {
        background-color:  ${({ accentColor }) => lightenColor(accentColor)};
      }
    }
   }
  .table-menu-button-popover-backdrop {
    background-color: transparent !important;
  }

  .menu-button-popover, .${BClasses.MINIMAL}.menu-button-popover.${
  Classes.POPOVER2
} {
    background: none;
    box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
    margin-top: 8px !important;
    margin-bottom: 8px !important;
    border-radius: ${({ borderRadius }) =>
      borderRadius >= THEMEING_TEXT_SIZES.lg ? `0.375rem` : borderRadius};
    overflow: hidden;
  }

  .menu-button-popover .${BClasses.MENU_ITEM} {
    padding: 9px 12px;
    border-radius: 0;
  }

  & > .${Classes.POPOVER2_TARGET} {
    height: 100%;
  }

  ${({ menuDropDownWidth, parentWidth }) => `
  .menu-button-width {
    max-width: ${
      menuDropDownWidth > parentWidth
        ? `${menuDropDownWidth}px`
        : `${parentWidth}px`
    } !important;
    min-width: ${
      parentWidth > menuDropDownWidth ? parentWidth : menuDropDownWidth
    }px !important;
  }
`}
`;

interface BaseStyleProps {
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  boxShadowColor?: string;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  isCompact?: boolean;
  textColor?: string;
  placement?: ButtonPlacement;
  compactMode?: string;
}

const BaseButton = styled(Button)<ThemeProp & BaseStyleProps>`
  height: 100%;
  background-image: none !important;
  font-weight: ${(props) => props.theme.fontWeights[2]};
  outline: none;
  padding: 0px 10px;
  overflow: hidden;
  border: 1.2px solid #ebebeb;
  border-radius: 0;
  box-shadow: none !important;
  min-height: ${({ compactMode }) =>
    compactMode === "SHORT" ? "24px" : "30px"};
  font-size: ${({ compactMode }) =>
    compactMode === "SHORT" ? "12px" : "14px"};
  line-height: ${({ compactMode }) =>
    compactMode === "SHORT" ? "24px" : "28px"};

  ${({ buttonColor, buttonVariant, theme }) => `
    &:enabled {
      background: ${
        getCustomBackgroundColor(buttonVariant, buttonColor) !== "none"
          ? getCustomBackgroundColor(buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.PRIMARY
          ? theme.colors.button.primary.primary.bgColor
          : "none"
      } !important;
    }

    &:hover:enabled, &:active:enabled {
      background: ${
        getCustomHoverColor(theme, buttonVariant, buttonColor) !== "none"
          ? getCustomHoverColor(theme, buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.SECONDARY
          ? theme.colors.button.primary.secondary.hoverColor
          : buttonVariant === ButtonVariantTypes.TERTIARY
          ? theme.colors.button.primary.tertiary.hoverColor
          : theme.colors.button.primary.primary.hoverColor
      } !important;
    }

    &:disabled {
      border: ${
        buttonVariant === ButtonVariantTypes.SECONDARY
          ? "1px solid var(--wds-color-border-disabled)"
          : "none"
      } !important;
      background: ${
        buttonVariant !== ButtonVariantTypes.TERTIARY
          ? "var(--wds-color-bg-disabled)"
          : "transparent"
      } !important;
      color: var(--wds-color-text-disabled) !important;
      
      span {
        color: var(--wds-color-text-disabled) !important;
      }
    }

    border: ${
      getCustomBorderColor(buttonVariant, buttonColor) !== "none"
        ? `1px solid ${getCustomBorderColor(buttonVariant, buttonColor)}`
        : buttonVariant === ButtonVariantTypes.SECONDARY
        ? `1px solid ${theme.colors.button.primary.secondary.borderColor}`
        : "none"
    } !important;

    & > span {
      max-width: 99%;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      max-height: 100%;
      overflow: hidden;
      color: ${
        buttonVariant === ButtonVariantTypes.PRIMARY
          ? getComplementaryGrayscaleColor(buttonColor)
          : getCustomBackgroundColor(
              ButtonVariantTypes.PRIMARY,
              buttonColor,
            ) !== "none"
          ? getCustomBackgroundColor(ButtonVariantTypes.PRIMARY, buttonColor)
          : `${theme.colors.button.primary.secondary.textColor}`
      } !important;
    }
  `}

  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow}  !important;
  ${({ placement }) =>
    placement
      ? `
      justify-content: ${getCustomJustifyContent(placement)};
      & > span.bp3-button-text {
        flex: unset !important;
      }
    `
      : ""}
`;

const BaseMenuItem = styled(MenuItem)<ThemeProp & BaseStyleProps>`
  &.${CoreClasses.MENU_ITEM}.${CoreClasses.DISABLED} {
    background-color: ${Colors.GREY_1} !important;
  }

  font-family: var(--wds-font-family);

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
  ${({ isCompact }) =>
    isCompact &&
    `
      padding-top: 3px !important;
      padding-bottom: 3px !important;
      font-size: 12px;
  `}
`;

const StyledMenu = styled(Menu)<{
  backgroundColor?: string;
}>`
  padding: 0;
  min-width: 0px;
  overflow: hidden;
  background: none;

  ${BClasses.MENU_ITEM}:hover {
    background-color: ${({ backgroundColor }) => lightenColor(backgroundColor)};
  }
`;

interface PopoverContentProps {
  menuItems: MenuItems;
  onItemClicked: (onClick: string | undefined, index: number) => void;
  isCompact?: boolean;
  rowIndex: number;
  backgroundColor?: string;
  borderRadius?: string;
  menuItemsSource: MenuItemsSource;
  configureMenuItems: {
    label: string;
    id: string;
    config: {
      id: string;
      label: any;
      isVisible: any;
      isDisabled: any;
      onClick?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
    };
  };
  sourceData?: Array<Record<string, unknown>>;
}

function PopoverContent(props: PopoverContentProps) {
  const {
    backgroundColor,
    configureMenuItems,
    isCompact,
    menuItems: itemsObj,
    menuItemsSource,
    onItemClicked,
    rowIndex,
    sourceData,
  } = props;

  if (menuItemsSource === MenuItemsSource.STATIC && !itemsObj)
    return <StyledMenu />;

  if (menuItemsSource === MenuItemsSource.DYNAMIC && !sourceData?.length)
    return <StyledMenu />;

  const getItems = () => {
    if (menuItemsSource === MenuItemsSource.STATIC) {
      const visibleItems = Object.keys(itemsObj)
        .map((itemKey) => itemsObj[itemKey])
        .filter((item) => getBooleanPropertyValue(item.isVisible, rowIndex));

      return orderBy(visibleItems, ["index"], ["asc"]);
    } else if (
      menuItemsSource === MenuItemsSource.DYNAMIC &&
      sourceData?.length
    ) {
      const getValue = (property: string, index: number) => {
        const propertyName = property as keyof typeof configureMenuItems.config;

        if (isArray(configureMenuItems.config[propertyName])) {
          return configureMenuItems.config[propertyName][index];
        }

        return configureMenuItems.config[propertyName];
      };

      const visibleItems = sourceData
        .map((item, index) => ({
          ...item,
          isVisible: getValue("isVisible", index),
          isDisabled: getValue("isDisabled", index),
          index: index,
          widgetId: "",
          label: configureMenuItems?.config?.label?.[index],
          onClick: configureMenuItems?.config?.onClick,
          textColor: getValue("textColor", index),
          backgroundColor: getValue("backgroundColor", index),
          iconAlign: getValue("iconAlign", index),
          iconColor: getValue("iconColor", index),
          iconName: getValue("iconName", index),
        }))
        .filter((item) => item.isVisible === true);

      return visibleItems;
    }
  };

  const items = getItems();

  if (!items) return <StyledMenu />;

  const listItems = items.map((menuItem: any, index: number) => {
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

    return (
      <BaseMenuItem
        backgroundColor={
          getPropertyValue(backgroundColor, rowIndex) || "#FFFFFF"
        }
        disabled={getBooleanPropertyValue(isDisabled, rowIndex)}
        icon={
          iconAlign !== Alignment.RIGHT ? (
            <Icon color={iconColor} icon={iconName || undefined} />
          ) : (
            undefined
          )
        }
        isCompact={isCompact}
        key={id}
        labelElement={
          iconAlign === Alignment.RIGHT ? (
            <Icon color={iconColor} icon={iconName || undefined} />
          ) : (
            undefined
          )
        }
        onClick={() => onItemClicked(onClick, index)}
        text={label}
        textColor={getPropertyValue(textColor, rowIndex)}
      />
    );
  });

  return <StyledMenu backgroundColor={backgroundColor}>{listItems}</StyledMenu>;
}

interface PopoverTargetButtonProps {
  borderRadius?: string;
  boxShadow?: string;
  boxShadowColor?: string;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  iconName?: IconName;
  iconAlign?: Alignment;
  isDisabled?: boolean;
  label?: string;
  placement?: ButtonPlacement;
  compactMode?: string;
}

function PopoverTargetButton(props: PopoverTargetButtonProps) {
  const {
    borderRadius,
    boxShadow,
    buttonColor,
    buttonVariant,
    compactMode,
    iconAlign,
    iconName,
    isDisabled,
    label,
    placement,
  } = props;

  return (
    <BaseButton
      alignText={iconName ? Alignment.LEFT : Alignment.CENTER}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      buttonColor={buttonColor}
      buttonVariant={buttonVariant}
      compactMode={compactMode}
      disabled={isDisabled}
      fill
      icon={iconAlign !== Alignment.RIGHT ? iconName : undefined}
      placement={placement}
      rightIcon={iconAlign === Alignment.RIGHT ? iconName : undefined}
      text={label}
    />
  );
}

export interface MenuButtonComponentProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isCompact?: boolean;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius: any;
  boxShadow?: string;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked: (onClick: string | undefined, index: number) => void;
  rowIndex: number;
  compactMode?: string;
  menuItemsSource: MenuItemsSource;
  configureMenuItems: {
    label: string;
    id: string;
    config: {
      id: string;
      label: any;
      isVisible: any;
      isDisabled: any;
      onClick?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
    };
  };
  sourceData?: Array<Record<string, unknown>>;
  menuDropDownWidth: number;
  placement?: ButtonPlacement;
  width: number;
}

function MenuButtonTableComponent(props: MenuButtonComponentProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    compactMode,
    configureMenuItems,
    iconAlign,
    iconName,
    isCompact,
    isDisabled,
    label,
    menuColor = "#e1e1e1",
    menuDropDownWidth,
    menuItems,
    menuItemsSource,
    menuVariant,
    onItemClicked,
    placement,
    rowIndex,
    sourceData,
    width,
  } = props;

  return (
    <MenuButtonContainer
      onClick={(e) => {
        //Stop propagating event so selectedRow will remain unchanged
        e.stopPropagation();
      }}
    >
      <PopoverStyles
        accentColor={menuColor}
        borderRadius={borderRadius}
        menuDropDownWidth={menuDropDownWidth}
        parentWidth={width - WidgetContainerDiff}
      />
      <Popover2
        backdropProps={{
          className: "table-menu-button-popover-backdrop",
        }}
        content={
          <PopoverContent
            backgroundColor={menuColor}
            borderRadius={borderRadius}
            configureMenuItems={configureMenuItems}
            isCompact={isCompact}
            menuItems={menuItems}
            menuItemsSource={menuItemsSource}
            onItemClicked={onItemClicked}
            rowIndex={rowIndex}
            sourceData={sourceData}
          />
        }
        disabled={isDisabled}
        fill
        minimal
        placement="bottom-end"
        popoverClassName="table-menu-button-popover"
      >
        <PopoverTargetButton
          borderRadius={borderRadius}
          boxShadow={boxShadow}
          boxShadowColor={boxShadowColor}
          buttonColor={menuColor}
          buttonVariant={menuVariant}
          compactMode={compactMode}
          iconAlign={iconAlign}
          iconName={iconName}
          isDisabled={isDisabled}
          label={label}
          placement={placement}
        />
      </Popover2>
    </MenuButtonContainer>
  );
}

export default MenuButtonTableComponent;
