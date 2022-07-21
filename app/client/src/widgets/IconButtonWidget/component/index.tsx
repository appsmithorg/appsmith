import React, { useMemo } from "react";
import styled from "styled-components";
import { Button, Position } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

import { ComponentProps } from "widgets/BaseComponent";
import { ThemeProp } from "components/ads/common";
import {
  RenderMode,
  RenderModes,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import _ from "lodash";
import {
  ButtonBorderRadius,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomHoverColor,
  getComplementaryGrayscaleColor,
} from "widgets/WidgetUtils";
import { createGlobalStyle } from "constants/DefaultTheme";
import Interweave from "interweave";
import { Popover2 } from "@blueprintjs/popover2";

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

type IconButtonContainerProps = {
  disabled?: boolean;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  hasOnClickAction?: boolean;
  renderMode: RenderMode;
};

const IconButtonContainer = styled.div<IconButtonContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

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
    ])}
  />
))<ThemeProp & ButtonStyleProps>`
  background-image: none !important;
  height: ${({ dimension }) => (dimension ? `${dimension}px` : "auto")};
  width: ${({ dimension }) => (dimension ? `${dimension}px` : "auto")};
  min-height: 32px !important;
  min-width: 32px !important;

  ${({ buttonColor, buttonVariant, hasOnClickAction, theme }) => `
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
        ? `&:hover:enabled, &:active:enabled {
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
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
      pointer-events: none;
    }

    &&:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      border-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
      > span {
        color: ${theme.colors.button.disabled.textColor} !important;
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
      min-height: 16px;
      min-width: 16px;
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

  const iconBtnWrapper = (
    <IconButtonContainer
      buttonColor={buttonColor}
      buttonVariant={buttonVariant}
      disabled={isDisabled}
      hasOnClickAction={hasOnClickAction}
      onClick={() => {
        if (isDisabled) return;
        onClick();
      }}
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
