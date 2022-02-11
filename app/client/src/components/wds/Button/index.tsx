import React, { useRef, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  IButtonProps,
  MaybeElement,
  Button as BButton,
  Alignment,
  Position,
} from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";
import { withTooltip } from "components/wds";

import { ThemeProp, Variant } from "components/ads/common";
import { Colors } from "constants/Colors";

import _ from "lodash";
import {
  ButtonPlacement,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import {
  getComplementaryGrayscaleColor,
  getCustomJustifyContent,
  lightenColor,
} from "widgets/WidgetUtils";
import { borderRadiusOptions } from "constants/ThemeConstants";
import withRecaptcha, { RecaptchaProps } from "./withRecaptcha";

export const StyledButton = styled((props) => (
  <BButton
    {..._.omit(props, [
      "borderRadius",
      "boxShadow",
      "buttonColor",
      "buttonVariant",
      "variant",
    ])}
  />
))<ButtonProps>`
  gap: 8px;
  height: 100%;
  outline: none;
  padding: 0px 10px;
  background-image: none !important;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;

  ${({ buttonColor }) => `
    &.button--solid {
      &:enabled {
        background: ${buttonColor};
        color: ${getComplementaryGrayscaleColor(buttonColor)}
      }
    }

    &.button--outline {
      &:enabled {
        background: none;
        border: 1px solid ${buttonColor};
        color: ${buttonColor};
      }

      &:enabled:hover {
        background: ${lightenColor(buttonColor)};
      }
    }

    &.button--ghost {
      &:enabled {
        background: none;
        color: ${buttonColor};
      }

      &:enabled:hover {
        background: ${lightenColor(buttonColor)};
      }
    }

    &.button--link {
      &:enabled {
        background: none;
        color: ${buttonColor};
      }

      &:enabled:hover {
        text-decoration: underline;
      }
    }

    &.bp3-fill {
      flex-grow: 1;
      width: auto;
    }

    &:disabled {
      background-color: ${Colors.GREY_1} !important;
      color: ${Colors.GREY_9} !important;
      box-shadow: none !important;
      pointer-events: none;
      border-color: ${Colors.GREY_1} !important;
      > span {
        color: ${Colors.GREY_9} !important;
      }
    }

    & > * {
      margin-right: 0;
    }

    & > span, & > span.bp3-icon {
      max-height: 100%;
      max-width: 99%;
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      line-height: normal;
      color: inherit;
    }
  `}

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

type ButtonStyleProps = {
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
};

interface ButtonProps extends IButtonProps, ButtonStyleProps, RecaptchaProps {
  variant?: keyof typeof VariantTypes;
  boxShadow?: string;
  borderRadius?: string;
  tooltip?: string;
  children: React.ReactNode;
}

enum VariantTypes {
  solid = "solid",
  outline = "outline",
  ghost = "ghost",
  link = "link",
}
function Button(props: ButtonProps) {
  const { children, ...rest } = props;

  return (
    <StyledButton
      {...rest}
      className={`button--${props.variant}`}
      text={children}
    />
  );
}

Button.defaultProps = {
  buttonVariant: ButtonVariantTypes.PRIMARY,
  disabled: false,
  text: "Button Text",
  minimal: true,
  variant: "solid",
  buttonColor: "#553DE9",
  borderRadius: borderRadiusOptions.md,
} as ButtonProps;

export default withRecaptcha(withTooltip(Button));
