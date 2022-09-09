import React, { useRef, useState } from "react";
import styled, { createGlobalStyle, css } from "styled-components";
import Interweave from "interweave";
import {
  IButtonProps,
  MaybeElement,
  Button,
  Alignment,
  Position,
  Classes,
} from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { IconName } from "@blueprintjs/icons";

import { ComponentProps } from "widgets/BaseComponent";

import { useScript, ScriptStatus, AddScriptTo } from "utils/hooks/useScript";
import {
  GOOGLE_RECAPTCHA_KEY_ERROR,
  GOOGLE_RECAPTCHA_DOMAIN_ERROR,
  createMessage,
} from "@appsmith/constants/messages";
import { ThemeProp, Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";

import ReCAPTCHA from "react-google-recaptcha";
import { Colors } from "constants/Colors";
import _ from "lodash";
import {
  ButtonPlacement,
  ButtonVariant,
  ButtonVariantTypes,
  RecaptchaType,
  RecaptchaTypes,
} from "components/constants";
import {
  getCustomBackgroundColor,
  getCustomBorderColor,
  getCustomJustifyContent,
  getAlignText,
  getComplementaryGrayscaleColor,
} from "widgets/WidgetUtils";
import { DragContainer } from "./DragContainer";
import { buttonHoverActiveStyles } from "./utils";

const RecaptchaWrapper = styled.div`
  position: relative;
  .grecaptcha-badge {
    visibility: hidden;
  }
`;

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
  .btnTooltipContainer {
    .bp3-popover2-content {
      max-width: 350px;
      overflow-wrap: anywhere;
      padding: 10px 12px;
      border-radius: 0px;
    }
  }
`;

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

const buttonBaseStyle = css<ThemeProp & ButtonStyleProps>`
height: 100%;
background-image: none !important;
font-weight: ${(props) => props.theme.fontWeights[2]};
outline: none;
padding: 0px 10px;
gap: 8px;

&:hover, &:active {
  ${buttonHoverActiveStyles}
 }

${({ buttonColor, buttonVariant, theme }) => `
    background: ${
      getCustomBackgroundColor(buttonVariant, buttonColor) !== "none"
        ? getCustomBackgroundColor(buttonVariant, buttonColor)
        : buttonVariant === ButtonVariantTypes.PRIMARY
        ? theme.colors.button.primary.primary.bgColor
        : "none"
    } !important;


    &:disabled, &.${Classes.DISABLED} {
    cursor: not-allowed;
    background-color: ${Colors.GREY_1} !important;
    color: ${Colors.GREY_9} !important;
    box-shadow: none !important;
    pointer-events: none;
    border-color: ${Colors.GREY_1} !important;

    > span {
      color: ${Colors.GREY_9} !important;
    }
  }

  border: ${
    getCustomBorderColor(buttonVariant, buttonColor) !== "none"
      ? `1px solid ${getCustomBorderColor(buttonVariant, buttonColor)}`
      : buttonVariant === ButtonVariantTypes.SECONDARY
      ? `1px solid ${theme.colors.button.primary.secondary.borderColor}`
      : "none"
  } !important;

  & > * {
    margin-right: 0;
  }

  & > span {
    max-height: 100%;
    max-width: 99%;
    text-overflow: ellipsis;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    line-height: normal;

    color: ${
      buttonVariant === ButtonVariantTypes.PRIMARY
        ? getComplementaryGrayscaleColor(buttonColor)
        : getCustomBackgroundColor(ButtonVariantTypes.PRIMARY, buttonColor)
    } !important;
  }
`}

border-radius: ${({ borderRadius }) => borderRadius};
box-shadow: ${({ boxShadow }) => `${boxShadow ?? "none"}`} !important;

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

export const StyledButton = styled((props) => (
  <Button
    {..._.omit(props, [
      "borderRadius",
      "boxShadow",
      "boxShadowColor",
      "buttonColor",
      "buttonVariant",
    ])}
  />
))<ThemeProp & ButtonStyleProps>`
  ${buttonBaseStyle}
`;

export type ButtonStyleProps = {
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  boxShadow?: string;
  boxShadowColor?: string;
  borderRadius?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
};

// To be used in any other part of the app
export function BaseButton(props: IButtonProps & ButtonStyleProps) {
  const {
    borderRadius,
    boxShadow,
    boxShadowColor,
    buttonColor,
    buttonVariant,
    className,
    disabled,
    icon,
    iconAlign,
    iconName,
    loading,
    onClick,
    placement,
    rightIcon,
    text,
  } = props;

  const isRightAlign = iconAlign === Alignment.RIGHT;

  return (
    <DragContainer
      buttonColor={buttonColor}
      buttonVariant={buttonVariant}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      showInAllModes
    >
      <StyledButton
        alignText={getAlignText(isRightAlign, iconName)}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        boxShadowColor={boxShadowColor}
        buttonColor={buttonColor}
        buttonVariant={buttonVariant}
        className={className}
        data-test-variant={buttonVariant}
        disabled={disabled}
        fill
        icon={isRightAlign ? icon : iconName || icon}
        loading={loading}
        onClick={onClick}
        placement={placement}
        rightIcon={isRightAlign ? iconName || rightIcon : rightIcon}
        text={text}
      />
    </DragContainer>
  );
}

BaseButton.defaultProps = {
  buttonColor: Colors.GREEN,
  buttonVariant: ButtonVariantTypes.PRIMARY,
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
  recaptchaType?: RecaptchaType;
}

interface ButtonComponentProps extends ComponentProps {
  text?: string;
  icon?: IconName | MaybeElement;
  tooltip?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  isDisabled?: boolean;
  isLoading: boolean;
  rightIcon?: IconName | MaybeElement;
  type: ButtonType;
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  borderRadius?: string;
  boxShadow?: string;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
  className?: string;
}

type RecaptchaV2ComponentPropType = {
  children: any;
  className?: string;
  isDisabled?: boolean;
  recaptchaType?: RecaptchaType;
  isLoading: boolean;
  handleError: (event: React.MouseEvent<HTMLElement>, error: string) => void;
};

function RecaptchaV2Component(
  props: RecaptchaV2ComponentPropType & RecaptchaProps,
) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isInvalidKey, setInvalidKey] = useState(false);
  const handleRecaptchaLoading = (isloading: boolean) => {
    props.handleRecaptchaV2Loading && props.handleRecaptchaV2Loading(isloading);
  };
  const handleBtnClick = async (event: React.MouseEvent<HTMLElement>) => {
    if (props.isDisabled) return;
    if (props.isLoading) return;
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
    <RecaptchaWrapper className={props.className} onClick={handleBtnClick}>
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

type RecaptchaV3ComponentPropType = {
  children: any;
  className?: string;
  isDisabled?: boolean;
  recaptchaType?: RecaptchaType;
  isLoading: boolean;
  handleError: (event: React.MouseEvent<HTMLElement>, error: string) => void;
};

function RecaptchaV3Component(
  props: RecaptchaV3ComponentPropType & RecaptchaProps,
) {
  // Check if a string is a valid JSON string
  const checkValidJson = (inputString: string): boolean => {
    return !inputString.includes('"');
  };

  const handleBtnClick = (event: React.MouseEvent<HTMLElement>) => {
    if (props.isDisabled) return;
    if (props.isLoading) return;
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
    AddScriptTo.HEAD,
  );
  return (
    <div className={props.className} onClick={handleBtnClick}>
      {props.children}
    </div>
  );
}

function BtnWrapper(
  props: {
    children: any;
    className?: string;
    isDisabled?: boolean;
    isLoading: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  } & RecaptchaProps,
) {
  if (!props.googleRecaptchaKey) {
    return (
      <div
        className={props.className}
        onClick={(e: React.MouseEvent<HTMLElement>) =>
          props.onClick && !props.isLoading && props.onClick(e)
        }
      >
        {props.children}
      </div>
    );
  } else {
    const handleError = (
      event: React.MouseEvent<HTMLElement>,
      error: string,
    ) => {
      Toaster.show({
        text: error,
        variant: Variant.danger,
      });
      props.onClick && !props.isLoading && props.onClick(event);
    };
    if (props.recaptchaType === RecaptchaTypes.V2) {
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
      className={props.className}
      clickWithRecaptcha={props.clickWithRecaptcha}
      googleRecaptchaKey={props.googleRecaptchaKey}
      handleRecaptchaV2Loading={props.handleRecaptchaV2Loading}
      isDisabled={props.isDisabled}
      isLoading={props.isLoading}
      onClick={props.onClick}
      recaptchaType={props.recaptchaType}
    >
      <BaseButton
        borderRadius={props.borderRadius}
        boxShadow={props.boxShadow}
        boxShadowColor={props.boxShadowColor}
        buttonColor={props.buttonColor}
        buttonVariant={props.buttonVariant}
        disabled={props.isDisabled}
        icon={props.icon}
        iconAlign={props.iconAlign}
        iconName={props.iconName}
        loading={props.isLoading}
        placement={props.placement}
        rightIcon={props.rightIcon}
        text={props.text}
        type={props.type}
      />
    </BtnWrapper>
  );
  if (props.tooltip) {
    return (
      <ToolTipWrapper>
        <TooltipStyles />
        <Popover2
          autoFocus={false}
          content={<Interweave content={props.tooltip} />}
          hoverOpenDelay={200}
          interactionKind="hover"
          portalClassName="btnTooltipContainer"
          position={Position.TOP}
        >
          {btnWrapper}
        </Popover2>
      </ToolTipWrapper>
    );
  } else {
    return btnWrapper;
  }
}

export default ButtonComponent;
