import React from "react";
import styled from "styled-components";
import {
  IButtonProps,
  MaybeElement,
  Button as BlueprintButton,
} from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { withTooltip } from "components/wds";

import { Colors } from "constants/Colors";

import _ from "lodash";
import {
  ButtonPlacement,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import {
  getComplementaryGrayscaleColor,
  lightenColor,
} from "widgets/WidgetUtils";
import { borderRadiusOptions } from "constants/ThemeConstants";
import withRecaptcha, { RecaptchaProps } from "./withRecaptcha";

type ButtonStyleProps = {
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  iconName?: IconName;
  placement?: ButtonPlacement;
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
};

export interface ButtonProps
  extends IButtonProps,
    ButtonStyleProps,
    RecaptchaProps {
  variant?: keyof typeof VariantTypes;
  boxShadow?: string;
  borderRadius?: string;
  tooltip?: string;
  children?: React.ReactNode;
  leftIcon?: IconName | MaybeElement;
  isDisabled?: boolean;
  isLoading?: boolean;
}

enum VariantTypes {
  solid = "solid",
  outline = "outline",
  ghost = "ghost",
  link = "link",
}

export const StyledButton = styled((props) => (
  <BlueprintButton
    {..._.omit(props, [
      "borderRadius",
      "boxShadow",
      "buttonColor",
      "buttonVariant",
      "variant",
      "justifyContent",
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
  justify-content: ${({ justifyContent }) => `${justifyContent}`} !important;
  flex-direction: ${({ iconAlign }) => `${iconAlign}`};

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
`;

function Button(props: ButtonProps) {
  const { children, isDisabled, isLoading, leftIcon, ...rest } = props;

  return (
    <StyledButton
      {...rest}
      className={`button--${props.variant} ${props.className}`}
      disabled={isDisabled}
      icon={leftIcon}
      loading={isLoading}
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
  justifyContent: "center",
} as ButtonProps;

export default withRecaptcha(withTooltip(Button));
