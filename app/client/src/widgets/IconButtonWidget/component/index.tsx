import React, { useMemo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Button, Position } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";

import type { ComponentProps } from "widgets/BaseComponent";
import type { RenderMode } from "constants/WidgetConstants";
import { RenderModes, WIDGET_PADDING } from "constants/WidgetConstants";
import _ from "lodash";
import type { ButtonBorderRadius, ButtonVariant } from "components/constants";
import { ButtonVariantTypes } from "components/constants";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomHoverColor,
  getComplementaryGrayscaleColor,
} from "widgets/WidgetUtils";
import Interweave from "interweave";
import { Popover2 } from "@blueprintjs/popover2";
import type { ThemeProp } from "WidgetProvider/types";

const ToolTipWrapper = styled.div`
  height: 100%;
  && .bp3-popover2-target {
    height: 100%;
    width: 100%;
    & > div {
      height: 100%;
    }
  }
`;

const TooltipStyles = createGlobalStyle`
  .iconBtnTooltipContainer {
    .bp3-popover2-content {
      max-width: 350px;
      overflow-wrap: anywhere;
      padding: 10px 12px;
      border-radius: 0px;
    }
  }
`;

interface IconButtonContainerProps {
  disabled?: boolean;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  hasOnClickAction?: boolean;
  renderMode: RenderMode;
}

const IconButtonContainer = styled.div<IconButtonContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;

  ${({ renderMode }) =>
    renderMode === RenderModes.CANVAS &&
    `
  position: relative;
  &:after {
    content: "";
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
  }

  `}

  ${({ buttonColor, buttonVariant, hasOnClickAction, renderMode, theme }) => `

  ${
    hasOnClickAction && renderMode === RenderModes.CANVAS
      ? `&:hover > button, &:active > button {
      background: ${
        getCustomHoverColor(theme, buttonVariant, buttonColor) !== "none"
          ? getCustomHoverColor(theme, buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.SECONDARY
            ? theme.colors.button.primary.secondary.hoverColor
            : buttonVariant === ButtonVariantTypes.TERTIARY
              ? theme.colors.button.primary.tertiary.hoverColor
              : theme.colors.button.primary.primary.hoverColor
      } !important;
    }`
      : ""
  }
`}

  ${({ disabled }) => disabled && "cursor: not-allowed;"}
`;

export interface ButtonStyleProps {
  borderRadius?: ButtonBorderRadius;
  boxShadow?: string;
  buttonColor: string;
  buttonVariant?: ButtonVariant;
  dimension?: number;
  hasOnClickAction?: boolean;
  compactMode?: string;
  minWidth?: number;
  minHeight?: number;
}

export const StyledButton = styled((props) => (
  <Button
    {..._.omit(props, [
      "buttonVariant",
      "buttonStyle",
      "borderRadius",
      "boxShadow",
      "dimension",
      "hasOnClickAction",
      "compactMode",
      "buttonColor",
      "primaryColor",
      "navColorStyle",
      "isMinimal",
      "insideSidebar",
    ])}
  />
))<ThemeProp & ButtonStyleProps>`
  background-image: none !important;
  height: ${({ dimension }) => (dimension ? `${dimension}px` : "auto")};
  width: ${({ dimension }) => (dimension ? `${dimension}px` : "auto")};
  min-height: ${({ compactMode }) =>
    compactMode === "SHORT" ? "24px" : "30px"};
  min-width: ${({ compactMode }) =>
    compactMode === "SHORT" ? "24px" : "30px"};
  font-size: ${({ compactMode }) =>
    compactMode === "SHORT" ? "12px" : "14px"};
  line-height: ${({ compactMode }) =>
    compactMode === "SHORT" ? "24px" : "28px"};

  ${({ minHeight, minWidth }) =>
    `&& {
      ${minWidth ? `min-width: ${minWidth}px;` : ""}
      ${minHeight ? `min-height: ${minHeight}px;` : ""}
    }
  `}

  ${({ buttonColor, buttonVariant, compactMode, hasOnClickAction, theme }) => `
    &:enabled {
      background: ${
        getCustomBackgroundColor(buttonVariant, buttonColor) !== "none"
          ? getCustomBackgroundColor(buttonVariant, buttonColor)
          : buttonVariant === ButtonVariantTypes.PRIMARY
            ? theme.colors.button.primary.primary.bgColor
            : "none"
      } !important;
    }

    ${
      hasOnClickAction
        ? `&:hover:enabled, &:active:enabled, &:focus:enabled {
        background: ${
          getCustomHoverColor(theme, buttonVariant, buttonColor) !== "none"
            ? getCustomHoverColor(theme, buttonVariant, buttonColor)
            : buttonVariant === ButtonVariantTypes.SECONDARY
              ? theme.colors.button.primary.secondary.hoverColor
              : buttonVariant === ButtonVariantTypes.TERTIARY
                ? theme.colors.button.primary.tertiary.hoverColor
                : theme.colors.button.primary.primary.hoverColor
        } !important;
      }`
        : ""
    }

    &:disabled {
      background: ${
        buttonVariant !== ButtonVariantTypes.TERTIARY
          ? "var(--wds-color-bg-disabled)"
          : "transparent"
      } !important;
      color: var(--wds-color-text-disabled) !important;
      pointer-events: none;
    }

    &&:disabled {
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
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;

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

    & > span > svg {
      height: 100%;
      width: 100%;
      min-height:
        ${compactMode === "SHORT" ? "14px" : "16px"};
      min-width:
        ${compactMode === "SHORT" ? "14px" : "16px"};
    }
  `}

  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow || "none"} !important;
`;

export interface IconButtonComponentProps extends ComponentProps {
  iconName?: IconName;
  buttonColor?: string;
  buttonVariant: ButtonVariant;
  borderRadius: string;
  boxShadow: string;
  isDisabled: boolean;
  isVisible: boolean;
  hasOnClickAction: boolean;
  onClick: () => void;
  renderMode: RenderMode;
  height: number;
  tooltip?: string;
  width: number;
  minHeight?: number;
  minWidth?: number;
}

function IconButtonComponent(props: IconButtonComponentProps) {
  const {
    borderRadius,
    boxShadow,
    buttonColor,
    buttonVariant,
    hasOnClickAction,
    height,
    isDisabled,
    minHeight,
    minWidth,
    onClick,
    renderMode,
    tooltip,
    width,
  } = props;

  /**
   * returns the dimension to be used for widget
   * whatever is the minimum between width and height,
   * we will use that for the dimension of the widget
   */
  const dimension = useMemo(() => {
    if (width > height) {
      return height - WIDGET_PADDING * 2;
    }

    return width - WIDGET_PADDING * 2;
  }, [width, height]);

  const hasOnClick = !isDisabled && hasOnClickAction;

  const iconBtnWrapper = (
    <IconButtonContainer
      buttonColor={buttonColor}
      buttonVariant={buttonVariant}
      disabled={isDisabled}
      hasOnClickAction={hasOnClickAction}
      onClick={hasOnClick ? onClick : undefined}
      renderMode={renderMode}
    >
      <StyledButton
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        buttonColor={buttonColor}
        buttonVariant={_.trim(buttonVariant)}
        dimension={dimension}
        disabled={isDisabled}
        hasOnClickAction={hasOnClickAction}
        icon={props.iconName}
        large
        minHeight={minHeight}
        minWidth={minWidth}
      />
    </IconButtonContainer>
  );

  if (!tooltip) return iconBtnWrapper;

  return (
    <ToolTipWrapper>
      <TooltipStyles />
      <Popover2
        autoFocus={false}
        content={<Interweave content={tooltip} />}
        hoverOpenDelay={200}
        interactionKind="hover"
        portalClassName="iconBtnTooltipContainer"
        position={Position.TOP}
      >
        {iconBtnWrapper}
      </Popover2>
    </ToolTipWrapper>
  );
}

export default IconButtonComponent;
