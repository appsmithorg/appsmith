import React, { useRef, useState } from "react";
import styled from "styled-components";
import tinycolor from "tinycolor2";

import {
  IButtonProps,
  MaybeElement,
  Button,
  Alignment,
  Position,
} from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

import Tooltip from "components/ads/Tooltip";
import { Theme } from "constants/DefaultTheme";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { useScript, ScriptStatus } from "utils/hooks/useScript";
import {
  GOOGLE_RECAPTCHA_KEY_ERROR,
  GOOGLE_RECAPTCHA_DOMAIN_ERROR,
  createMessage,
} from "constants/messages";
import { ThemeProp, Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import ReCAPTCHA from "react-google-recaptcha";
import {
  ButtonBoxShadow,
  ButtonBoxShadowTypes,
} from "components/propertyControls/BoxShadowOptionsControl";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
} from "components/propertyControls/BorderRadiusOptionsControl";

export enum ButtonStyleTypes {
  PRIMARY = "PRIMARY",
  WARNING = "WARNING",
  DANGER = "DANGER",
  INFO = "INFO",
  SECONDARY = "SECONDARY",
  CUSTOM = "CUSTOM",
}
export type ButtonStyle = keyof typeof ButtonStyleTypes;

export enum ButtonVariantTypes {
  SOLID = "SOLID",
  OUTLINE = "OUTLINE",
  GHOST = "GHOST",
}
export type ButtonVariant = keyof typeof ButtonVariantTypes;

const getCustomTextColor = (
  theme: Theme,
  backgroundColor?: string,
  prevButtonStyle?: ButtonStyle,
) => {
  if (!backgroundColor)
    return theme.colors.button[
      (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
    ].solid.textColor;
  const isDark = tinycolor(backgroundColor).isDark();
  if (isDark) {
    return theme.colors.button.custom.solid.light.textColor;
  }
  return theme.colors.button.custom.solid.dark.textColor;
};

const getCustomHoverColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyle,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  if (!backgroundColor) {
    return theme.colors.button[
      (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
    ][(buttonVariant || ButtonVariantTypes.SOLID).toLowerCase()].hoverColor;
  }

  switch (buttonVariant) {
    case ButtonVariantTypes.OUTLINE:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.outline.hoverColor;
      break;
    case ButtonVariantTypes.GHOST:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .lighten(40)
            .toString()
        : theme.colors.button.primary.ghost.hoverColor;
      break;

    default:
      return backgroundColor
        ? tinycolor(backgroundColor)
            .darken(10)
            .toString()
        : theme.colors.button.primary.solid.hoverColor;
      break;
  }
};

const getCustomBackgroundColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyle,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.SOLID
    ? backgroundColor
      ? backgroundColor
      : theme.colors.button[
          (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
        ].solid.bgColor
    : "none";
};

const getCustomBorderColor = (
  theme: Theme,
  prevButtonStyle?: ButtonStyle,
  buttonVariant?: ButtonVariant,
  backgroundColor?: string,
) => {
  return buttonVariant === ButtonVariantTypes.OUTLINE
    ? backgroundColor
      ? backgroundColor
      : theme.colors.button[
          (prevButtonStyle || ButtonStyleTypes.PRIMARY).toLowerCase()
        ].outline.borderColor
    : "none";
};

const RecaptchaWrapper = styled.div`
  position: relative;
  .grecaptcha-badge {
    visibility: hidden;
  }
`;

const ToolTipContent = styled.div`
  max-width: 350px;
`;

const ToolTipWrapper = styled.div`
  height: 100%;
  && .bp3-popover-target {
    height: 100%;
    & > div {
      height: 100%;
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  & > button {
    height: 100%;
  }
`;

const StyledButton = styled(Button)<ThemeProp & ButtonStyleProps>`
  height: 100%;
  background-image: none !important;
  font-weight: ${(props) => props.theme.fontWeights[2]};
  outline: none;
  padding: 0px 10px;

  ${({ buttonColor, buttonStyle, buttonVariant, prevButtonStyle, theme }) => `
    &:enabled {
      background: ${
        buttonStyle === ButtonStyleTypes.WARNING
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.warning.solid.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.DANGER
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.danger.solid.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.INFO
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.info.solid.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.secondary.solid.bgColor
            : "none"
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomBackgroundColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )
          : buttonVariant === ButtonVariantTypes.SOLID
          ? theme.colors.button.primary.solid.bgColor
          : "none"
      } !important;
    }

    &:hover:enabled, &:active:enabled {
      background: ${
        buttonStyle === ButtonStyleTypes.WARNING
          ? buttonVariant === ButtonVariantTypes.OUTLINE
            ? theme.colors.button.warning.outline.hoverColor
            : buttonVariant === ButtonVariantTypes.GHOST
            ? theme.colors.button.warning.ghost.hoverColor
            : theme.colors.button.warning.solid.hoverColor
          : buttonStyle === ButtonStyleTypes.DANGER
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.danger.solid.hoverColor
            : theme.colors.button.danger.outline.hoverColor
          : buttonStyle === ButtonStyleTypes.INFO
          ? buttonVariant === ButtonVariantTypes.SOLID
            ? theme.colors.button.info.solid.hoverColor
            : theme.colors.button.info.outline.hoverColor
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? buttonVariant === ButtonVariantTypes.OUTLINE
            ? theme.colors.button.secondary.outline.hoverColor
            : buttonVariant === ButtonVariantTypes.GHOST
            ? theme.colors.button.secondary.ghost.hoverColor
            : theme.colors.button.secondary.solid.hoverColor
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomHoverColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )
          : buttonVariant === ButtonVariantTypes.OUTLINE
          ? theme.colors.button.primary.outline.hoverColor
          : buttonVariant === ButtonVariantTypes.GHOST
          ? theme.colors.button.primary.ghost.hoverColor
          : theme.colors.button.primary.solid.hoverColor
      } !important;
    }

    &:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
    }

    border: ${
      buttonVariant === ButtonVariantTypes.OUTLINE
        ? buttonStyle === ButtonStyleTypes.WARNING
          ? `1px solid ${theme.colors.button.warning.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `1px solid ${theme.colors.button.danger.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `1px solid ${theme.colors.button.info.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `1px solid ${theme.colors.button.secondary.outline.borderColor}`
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? `1px solid ${getCustomBorderColor(
              theme,
              prevButtonStyle,
              buttonVariant,
              buttonColor,
            )}`
          : `1px solid ${theme.colors.button.primary.outline.borderColor}`
        : "none"
    } !important;

    & > span {
      max-height: 100%;
      max-width: 99%;
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      color: ${
        buttonVariant === ButtonVariantTypes.SOLID
          ? buttonStyle === ButtonStyleTypes.CUSTOM
            ? getCustomTextColor(theme, buttonColor, prevButtonStyle)
            : `${theme.colors.button.primary.solid.textColor}`
          : buttonStyle === ButtonStyleTypes.WARNING
          ? `${theme.colors.button.warning.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `${theme.colors.button.danger.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `${theme.colors.button.info.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `${theme.colors.button.secondary.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.CUSTOM
          ? getCustomBackgroundColor(
              theme,
              prevButtonStyle,
              ButtonVariantTypes.SOLID,
              buttonColor,
            )
          : `${theme.colors.button.primary.outline.textColor}`
      } !important;
    }
  `}


  border-radius: ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.ROUNDED ? "5px" : 0};

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

type ButtonStyleProps = {
  buttonColor?: string;
  buttonStyle?: ButtonStyle;
  prevButtonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  borderRadius?: ButtonBorderRadius;
  iconName?: IconName;
  iconAlign?: Alignment;
};

// To be used in any other part of the app
export function BaseButton(props: IButtonProps & ButtonStyleProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    buttonColor,
    buttonStyle,
    buttonVariant,
    className,
    disabled,
    icon,
    iconAlign,
    iconName,
    loading,
    onClick,
    prevButtonStyle,
    rightIcon,
    text,
  } = props;

  if (iconAlign === Alignment.RIGHT) {
    return (
      <StyledButton
        alignText={iconName ? Alignment.LEFT : Alignment.CENTER}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        boxShadowColor={boxShadowColor}
        buttonColor={buttonColor}
        buttonStyle={buttonStyle}
        buttonVariant={buttonVariant}
        className={className}
        disabled={disabled}
        fill
        icon={icon}
        loading={loading}
        onClick={onClick}
        prevButtonStyle={prevButtonStyle}
        rightIcon={iconName || rightIcon}
        text={text}
      />
    );
  }

  return (
    <StyledButton
      alignText={iconName ? Alignment.RIGHT : Alignment.CENTER}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      boxShadowColor={boxShadowColor}
      buttonColor={buttonColor}
      buttonStyle={buttonStyle}
      buttonVariant={buttonVariant}
      className={className}
      disabled={disabled}
      fill
      icon={iconName || icon}
      loading={loading}
      onClick={onClick}
      prevButtonStyle={prevButtonStyle}
      rightIcon={rightIcon}
      text={text}
    />
  );
}

BaseButton.defaultProps = {
  buttonStyle: "SECONDARY",
  buttonVariant: "SOLID",
  disabled: false,
  text: "Button Text",
  minimal: true,
};

export enum ButtonType {
  SUBMIT = "submit",
  RESET = "reset",
  BUTTON = "button",
}

interface RecaptchaProps {
  googleRecaptchaKey?: string;
  clickWithRecaptcha: (token: string) => void;
  handleRecaptchaV2Loading?: (isLoading: boolean) => void;
  recaptchaV2?: boolean;
}

interface ButtonComponentProps extends ComponentProps {
  text?: string;
  icon?: IconName | MaybeElement;
  tooltip?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  isDisabled?: boolean;
  buttonStyle?: ButtonStyle;
  prevButtonStyle?: ButtonStyle;
  isLoading: boolean;
  rightIcon?: IconName | MaybeElement;
  type: ButtonType;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
}

function RecaptchaV2Component(
  props: {
    children: any;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    recaptchaV2?: boolean;
    handleError: (event: React.MouseEvent<HTMLElement>, error: string) => void;
  } & RecaptchaProps,
) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isInvalidKey, setInvalidKey] = useState(false);
  const handleRecaptchaLoading = (isloading: boolean) => {
    props.handleRecaptchaV2Loading && props.handleRecaptchaV2Loading(isloading);
  };
  const handleBtnClick = async (event: React.MouseEvent<HTMLElement>) => {
    if (isInvalidKey) {
      // Handle incorrent google recaptcha site key
      props.handleError(event, createMessage(GOOGLE_RECAPTCHA_KEY_ERROR));
    } else {
      handleRecaptchaLoading(true);
      try {
        await recaptchaRef?.current?.reset();
        const token = await recaptchaRef?.current?.executeAsync();
        if (token) {
          props.clickWithRecaptcha(token);
        } else {
          // Handle incorrent google recaptcha site key
          props.handleError(event, createMessage(GOOGLE_RECAPTCHA_KEY_ERROR));
        }
        handleRecaptchaLoading(false);
      } catch (err) {
        handleRecaptchaLoading(false);
        // Handle error due to google recaptcha key of different domain
        props.handleError(event, createMessage(GOOGLE_RECAPTCHA_DOMAIN_ERROR));
      }
    }
  };
  return (
    <RecaptchaWrapper onClick={handleBtnClick}>
      {props.children}
      <ReCAPTCHA
        onErrored={() => setInvalidKey(true)}
        ref={recaptchaRef}
        sitekey={props.googleRecaptchaKey || ""}
        size="invisible"
      />
    </RecaptchaWrapper>
  );
}

function RecaptchaV3Component(
  props: {
    children: any;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    recaptchaV2?: boolean;
    handleError: (event: React.MouseEvent<HTMLElement>, error: string) => void;
  } & RecaptchaProps,
) {
  // Check if a string is a valid JSON string
  const checkValidJson = (inputString: string): boolean => {
    return !inputString.includes('"');
  };

  const handleBtnClick = (event: React.MouseEvent<HTMLElement>) => {
    if (status === ScriptStatus.READY) {
      (window as any).grecaptcha.ready(() => {
        try {
          (window as any).grecaptcha
            .execute(props.googleRecaptchaKey, {
              action: "submit",
            })
            .then((token: any) => {
              props.clickWithRecaptcha(token);
            })
            .catch(() => {
              // Handle incorrent google recaptcha site key
              props.handleError(
                event,
                createMessage(GOOGLE_RECAPTCHA_KEY_ERROR),
              );
            });
        } catch (err) {
          // Handle error due to google recaptcha key of different domain
          props.handleError(
            event,
            createMessage(GOOGLE_RECAPTCHA_DOMAIN_ERROR),
          );
        }
      });
    }
  };

  let validGoogleRecaptchaKey = props.googleRecaptchaKey;
  if (validGoogleRecaptchaKey && !checkValidJson(validGoogleRecaptchaKey)) {
    validGoogleRecaptchaKey = undefined;
  }
  const status = useScript(
    `https://www.google.com/recaptcha/api.js?render=${validGoogleRecaptchaKey}`,
  );
  return <div onClick={handleBtnClick}>{props.children}</div>;
}

function BtnWrapper(
  props: {
    children: any;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  } & RecaptchaProps,
) {
  if (!props.googleRecaptchaKey)
    return <div onClick={props.onClick}>{props.children}</div>;
  else {
    const handleError = (
      event: React.MouseEvent<HTMLElement>,
      error: string,
    ) => {
      Toaster.show({
        text: error,
        variant: Variant.danger,
      });
      props.onClick && props.onClick(event);
    };
    if (props.recaptchaV2) {
      return <RecaptchaV2Component {...props} handleError={handleError} />;
    } else {
      return <RecaptchaV3Component {...props} handleError={handleError} />;
    }
  }
}

// To be used with the canvas
function ButtonComponent(props: ButtonComponentProps & RecaptchaProps) {
  const btnWrapper = (
    <BtnWrapper
      clickWithRecaptcha={props.clickWithRecaptcha}
      googleRecaptchaKey={props.googleRecaptchaKey}
      handleRecaptchaV2Loading={props.handleRecaptchaV2Loading}
      onClick={props.onClick}
      recaptchaV2={props.recaptchaV2}
    >
      <ButtonContainer>
        <BaseButton
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
          boxShadowColor={props.boxShadowColor}
          buttonColor={props.buttonColor}
          buttonStyle={props.buttonStyle}
          buttonVariant={props.buttonVariant}
          disabled={props.isDisabled}
          icon={props.icon}
          iconAlign={props.iconAlign}
          iconName={props.iconName}
          loading={props.isLoading}
          prevButtonStyle={props.prevButtonStyle}
          rightIcon={props.rightIcon}
          text={props.text}
          type={props.type}
        />
      </ButtonContainer>
    </BtnWrapper>
  );
  if (props.tooltip) {
    return (
      <ToolTipWrapper>
        <Tooltip
          content={<ToolTipContent>{props.tooltip}</ToolTipContent>}
          hoverOpenDelay={200}
          position={Position.TOP}
        >
          {btnWrapper}
        </Tooltip>
      </ToolTipWrapper>
    );
  } else {
    return btnWrapper;
  }
}

export default ButtonComponent;
