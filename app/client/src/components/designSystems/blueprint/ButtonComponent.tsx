import React, { useRef, useState } from "react";
import styled, { css } from "styled-components";
import _ from "lodash";
import {
  IButtonProps,
  MaybeElement,
  Button,
  Alignment,
  Icon,
} from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { Theme, darkenHover, darkenActive } from "constants/DefaultTheme";
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

export enum ButtonBorderRadiusTypes {
  SHARP = "SHARP",
  ROUNDED = "ROUNDED",
  CIRCLE = "CIRCLE",
}
export type ButtonBorderRadius = keyof typeof ButtonBorderRadiusTypes;

// const getButtonColorStyles = (props: { theme: Theme } & ButtonStyleProps) => {
//   if (props.textColor) return props.textColor;
//   if (props.filled) return props.theme.colors.textOnDarkBG;
//   if (props.accent) {
//     if (props.accent === "secondary" || props.accent === "text") {
//       return props.theme.colors[AccentColorMap["primary"]];
//     }
//     return props.theme.colors[AccentColorMap[props.accent]];
//   }
// };

// const getButtonIconColorStyles = (
//   props: { theme: Theme } & ButtonStyleProps,
// ) => {
//   if (props.iconColor) return props.iconColor;
//   if (props.textColor) return props.textColor;
//   if (props.filled) return props.theme.colors.textOnDarkBG;
//   if (props.accent) {
//     if (props.accent === "secondary" || props.accent === "text") {
//       return props.theme.colors[AccentColorMap["primary"]];
//     }
//     return props.theme.colors[AccentColorMap[props.accent]];
//   }
// };

// const ButtonColorStyles = css<ButtonStyleProps>`
//   color: ${getButtonColorStyles};
//   svg {
//     fill: ${getButtonIconColorStyles};
//   }
// `;

const RecaptchaWrapper = styled.div`
  position: relative;
  .grecaptcha-badge {
    visibility: hidden;
  }
`;

// const AccentColorMap: Record<ButtonStyleName, string> = {
//   primary: "primaryOld",
//   secondary: "secondaryOld",
//   error: "error",
//   text: "text",
// };

// const ButtonWrapper = styled((props: ButtonStyleProps & IButtonProps) => (
//   <Button {..._.omit(props, ["accent", "filled"])} />
// ))<ButtonStyleProps>`
//   &&&& {
//     ${ButtonColorStyles};
//     width: 100%;
//     height: 100%;
//     background-image: none !important;
//     transition: background-color 0.2s;

//     box-shadow: ${({ boxShadow, boxShadowColor }) =>
//       boxShadow === ButtonBoxShadowTypes.VARIANT1
//         ? `0px 0px 4px 3px ${boxShadowColor || "rgba(0, 0, 0, 0.25)"}`
//         : boxShadow === ButtonBoxShadowTypes.VARIANT2
//         ? `3px 3px 4px ${boxShadowColor || "rgba(0, 0, 0, 0.25)"}`
//         : boxShadow === ButtonBoxShadowTypes.VARIANT3
//         ? `0px 1px 3px ${boxShadowColor || "rgba(0, 0, 0, 0.5)"}`
//         : boxShadow === ButtonBoxShadowTypes.VARIANT4
//         ? `2px 2px 0px ${boxShadowColor || "rgba(0, 0, 0, 0.25)"}`
//         : boxShadow === ButtonBoxShadowTypes.VARIANT5
//         ? `-2px -2px 0px ${boxShadowColor || "rgba(0, 0, 0, 0.25)"}`
//         : "none"} !important;

//     background-color: ${(props) =>
//       props.backgroundColor
//         ? props.filled && props.backgroundColor
//         : props.filled &&
//           props.accent &&
//           (props.theme.colors[AccentColorMap[props.accent]] ||
//             props.theme.colors[AccentColorMap.primary])};

//     border: ${(props) =>
//       props.accent !== "text" &&
//       (props.backgroundColor
//         ? `1px solid ${props.backgroundColor}`
//         : props.accent
//         ? `1px solid ${props.theme.colors[AccentColorMap[props.accent]] ||
//             props.textColor ||
//             props.theme.colors[AccentColorMap["primary"]]}`
//         : `1px solid ${props.theme.colors.primary}`)};
//     border-radius: 0;

//     font-weight: ${(props) => props.theme.fontWeights[2]};
//     outline: none;
//     &.bp3-button {
//       padding: 0px 10px;
//     }
//     && .bp3-button-text {
//       max-width: 99%;
//       text-overflow: ellipsis;
//       overflow: hidden;
//       display: -webkit-box;
//       -webkit-line-clamp: 1;
//       -webkit-box-orient: vertical;

//       max-height: 100%;
//       overflow: hidden;
//     }
//     &&:hover,
//     &&:focus {
//       ${ButtonColorStyles};
//       background-color: ${(props) => {
//         if (!props.filled) return props.theme.colors.secondaryDarker;
//         if (props.backgroundColor) return darkenHover(props.backgroundColor);
//         if (props.accent !== "secondary" && props.accent) {
//           return darkenHover(props.theme.colors[AccentColorMap[props.accent]]);
//         }
//       }};
//       border-color: ${(props) => {
//         if (!props.filled) return;
//         if (props.backgroundColor) return darkenHover(props.backgroundColor);
//         if (props.accent !== "secondary" && props.accent) {
//           return darkenHover(props.theme.colors[AccentColorMap[props.accent]]);
//         }
//       }};
//     }
//     &&:active {
//       ${ButtonColorStyles};
//       background-color: ${(props) => {
//         if (!props.filled) return props.theme.colors.secondaryDarkest;
//         if (props.backgroundColor) return darkenActive(props.backgroundColor);
//         if (props.accent !== "secondary" && props.accent) {
//           return darkenActive(props.theme.colors[AccentColorMap[props.accent]]);
//         }
//       }};
//       border-color: ${(props) => {
//         if (!props.filled) return;
//         if (props.backgroundColor) return darkenActive(props.backgroundColor);
//         if (props.accent !== "secondary" && props.accent) {
//           return darkenActive(props.theme.colors[AccentColorMap[props.accent]]);
//         }
//       }};
//     }
//     &&.bp3-disabled {
//       background-color: #d0d7dd;
//       border: none;
//     }
//   }
// `;

const StyledButton = styled(Button)<ThemeProp & ButtonStyleProps>`
  background-image: none !important;

  ${({ buttonStyle, buttonVariant, theme }) => `
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
          : `1px solid ${theme.colors.button.primary.outline.borderColor}`
        : "none"
    } !important;

    & > span {
      color: ${
        buttonVariant === ButtonVariantTypes.SOLID
          ? `${theme.colors.button.primary.solid.textColor}`
          : buttonStyle === ButtonStyleTypes.WARNING
          ? `${theme.colors.button.warning.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.DANGER
          ? `${theme.colors.button.danger.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.INFO
          ? `${theme.colors.button.info.outline.textColor}`
          : buttonStyle === ButtonStyleTypes.SECONDARY
          ? `${theme.colors.button.secondary.outline.textColor}`
          : `${theme.colors.button.primary.outline.textColor}`
      } !important;
    }
  `}


  border-radius: ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.CIRCLE
      ? "50%"
      : borderRadius === ButtonBorderRadiusTypes.ROUNDED
      ? "10px"
      : 0};

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

// export type ButtonStyleName = "primary" | "secondary" | "error" | "text";

type ButtonStyleProps = {
  backgroundColor?: string;
  textColor?: string;
  buttonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  borderRadius?: ButtonBorderRadius;
  iconName?: IconName;
  iconAlign?: Alignment;
  iconColor?: string;
};

// To be used in any other part of the app
export function BaseButton(props: IButtonProps & ButtonStyleProps) {
  const {
    backgroundColor,
    boxShadow,
    boxShadowColor,
    buttonStyle,
    className,
    disabled,
    icon,
    iconAlign,
    iconColor,
    iconName,
    rightIcon,
    text,
    textColor,
  } = props;

  if (iconAlign === Alignment.RIGHT) {
    return (
      <StyledButton
        alignText={iconName ? Alignment.LEFT : Alignment.CENTER}
        backgroundColor={backgroundColor}
        boxShadow={boxShadow}
        boxShadowColor={boxShadowColor}
        buttonStyle={buttonStyle}
        className={className}
        disabled={disabled}
        fill
        icon={icon}
        iconColor={iconColor}
        rightIcon={<Icon color={iconColor} icon={iconName} /> || rightIcon}
        text={text}
        textColor={textColor}
      />
    );
  }

  return (
    <StyledButton
      alignText={iconName ? Alignment.RIGHT : Alignment.CENTER}
      backgroundColor={backgroundColor}
      boxShadow={boxShadow}
      boxShadowColor={boxShadowColor}
      buttonStyle={buttonStyle}
      className={className}
      disabled={disabled}
      fill
      icon={<Icon color={iconColor} icon={iconName} /> || icon}
      rightIcon={rightIcon}
      text={text}
      textColor={textColor}
    />
  );
}

BaseButton.defaultProps = {
  // accent: "secondary",
  buttonStyle: "SECONDARY",
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
  recaptchaV2?: boolean;
}

interface ButtonComponentProps extends ComponentProps {
  text?: string;
  icon?: IconName | MaybeElement;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  isDisabled?: boolean;
  buttonStyle?: ButtonStyle;
  isLoading: boolean;
  rightIcon?: IconName | MaybeElement;
  type: ButtonType;
  backgroundColor?: string;
  textColor?: string;
  buttonVariant?: ButtonVariant;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  iconColor?: string;
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
  const handleBtnClick = async (event: React.MouseEvent<HTMLElement>) => {
    if (isInvalidKey) {
      // Handle incorrent google recaptcha site key
      props.handleError(event, createMessage(GOOGLE_RECAPTCHA_KEY_ERROR));
    } else {
      try {
        const token = await recaptchaRef?.current?.executeAsync();
        if (token) {
          props.clickWithRecaptcha(token);
        } else {
          // Handle incorrent google recaptcha site key
          props.handleError(event, createMessage(GOOGLE_RECAPTCHA_KEY_ERROR));
        }
      } catch (err) {
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
    try {
      JSON.parse(inputString);
      return true;
    } catch (err) {
      return false;
    }
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

  if (validGoogleRecaptchaKey && checkValidJson(validGoogleRecaptchaKey)) {
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
  return (
    <BtnWrapper
      clickWithRecaptcha={props.clickWithRecaptcha}
      googleRecaptchaKey={props.googleRecaptchaKey}
      onClick={props.onClick}
      recaptchaV2={props.recaptchaV2}
    >
      <BaseButton
        backgroundColor={props.backgroundColor}
        boxShadow={props.boxShadow}
        boxShadowColor={props.boxShadowColor}
        buttonStyle={props.buttonStyle}
        buttonVariant={props.buttonVariant}
        disabled={props.isDisabled}
        icon={props.icon}
        iconAlign={props.iconAlign}
        iconColor={props.iconColor}
        iconName={props.iconName}
        loading={props.isLoading}
        rightIcon={props.rightIcon}
        text={props.text}
        textColor={props.textColor}
        type={props.type}
      />
    </BtnWrapper>
  );
}

export default ButtonComponent;
