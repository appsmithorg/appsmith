import React from "react";
import {
  CommonComponentProps,
  hexToRgba,
  ThemeProp,
  Classes,
  Variant,
} from "./common";
import styled, { css } from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import Spinner from "./Spinner";
import { mediumButton, smallButton, largeButton } from "constants/DefaultTheme";

export enum Category {
  primary = "primary",
  secondary = "secondary",
  tertiary = "tertiary",
}

export enum Size {
  xxs = "xxs",
  xs = "xs",
  small = "small",
  medium = "medium",
  large = "large",
}

type stateStyleType = {
  bgColorPrimary: string;
  borderColorPrimary: string;
  txtColorPrimary: string;
  bgColorSecondary: string;
  borderColorSecondary: string;
  txtColorSecondary: string;
  bgColorTertiary: string;
  borderColorTertiary: string;
  txtColorTertiary: string;
};

type BtnColorType = {
  bgColor: string;
  txtColor: string;
  border: string;
};

type BtnFontType = {
  buttonFont: any;
  padding: string;
  height: number;
};

type ButtonProps = CommonComponentProps & {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  text?: string;
  category?: Category;
  variant?: Variant;
  className?: string;
  icon?: IconName;
  size?: Size;
  fill?: boolean;
  href?: string;
  tag?: "a" | "button";
  type?: "submit" | "reset" | "button";
  target?: string;
};

const defaultProps = {
  category: Category.primary,
  variant: Variant.info,
  size: Size.small,
  isLoading: false,
  disabled: false,
  fill: false,
  tag: "a",
};

const getDisabledStyles = (props: ThemeProp & ButtonProps) => {
  const variant = props.variant || defaultProps.variant;
  const category = props.category || defaultProps.category;

  const stylesByCategory = {
    [Category.primary]: {
      txtColorPrimary: props.theme.colors.button.disabledText,
      bgColorPrimary: props.theme.colors[variant].darkest,
      borderColorPrimary: props.theme.colors[variant].darkest,
    },
    [Category.secondary]: {
      txtColorSecondary: props.theme.colors.button.disabledText,
      bgColorSecondary: props.theme.colors[variant].darkest,
      borderColorSecondary: props.theme.colors[variant].darker,
    },
    [Category.tertiary]: {
      txtColorTertiary: props.theme.colors.button.disabledText,
      bgColorTertiary: props.theme.colors.tertiary.darker,
      borderColorTertiary: props.theme.colors.tertiary.dark,
    },
  };

  return stylesByCategory[category];
};

const getMainStateStyles = (props: ThemeProp & ButtonProps) => {
  const variant = props.variant || defaultProps.variant;
  const category = props.category || defaultProps.category;

  const stylesByCategory = {
    [Category.primary]: {
      bgColorPrimary: props.theme.colors[variant].main,
      borderColorPrimary: props.theme.colors[variant].main,
      txtColorPrimary: "#fff",
    },
    [Category.secondary]: {
      borderColorSecondary: props.theme.colors[variant].main,
      txtColorSecondary: props.theme.colors[variant].main,
      bgColorSecondary: "transparent",
    },
    [Category.tertiary]: {
      bgColorTertiary: "transparent",
      borderColorTertiary: props.theme.colors.tertiary.main,
      txtColorTertiary: props.theme.colors.tertiary.main,
    },
  };

  return stylesByCategory[category];
};

const getHoverStateStyles = (props: ThemeProp & ButtonProps) => {
  const variant = props.variant || defaultProps.variant;
  const category = props.category || defaultProps.category;

  const stylesByCategory = {
    [Category.primary]: {
      bgColorPrimary: props.theme.colors[variant].dark,
      borderColorPrimary: props.theme.colors[variant].dark,
      txtColorPrimary: "#fff",
    },
    [Category.secondary]: {
      bgColorSecondary: hexToRgba(props.theme.colors[variant].main, 0.1),
      txtColorSecondary: props.theme.colors[variant].main,
      borderColorSecondary: props.theme.colors[variant].main,
    },
    [Category.tertiary]: {
      bgColorTertiary: hexToRgba(props.theme.colors.tertiary.main, 0.1),
      borderColorTertiary: props.theme.colors.tertiary.main,
      txtColorTertiary: props.theme.colors.tertiary.main,
    },
  };

  return stylesByCategory[category];
};

const getActiveStateStyles = (props: ThemeProp & ButtonProps) => {
  const variant = props.variant || defaultProps.variant;
  const category = props.category || defaultProps.category;

  const stylesByCategory = {
    [Category.primary]: {
      bgColorPrimary: props.theme.colors[variant].dark,
      borderColorPrimary: props.theme.colors[variant].main,
      txtColorPrimary: "#fff",
    },
    [Category.secondary]: {
      bgColorSecondary: hexToRgba(props.theme.colors[variant].main, 0.1),
      txtColorSecondary: props.theme.colors[variant].light,
      borderColorSecondary: props.theme.colors[variant].light,
    },
    [Category.tertiary]: {
      bgColorTertiary: hexToRgba(props.theme.colors.tertiary.main, 0.1),
      borderColorTertiary: props.theme.colors.tertiary.light,
      txtColorTertiary: props.theme.colors.tertiary.light,
    },
  };

  return stylesByCategory[category];
};

const stateStyles = (
  props: ThemeProp & ButtonProps,
  stateArg: string,
): stateStyleType => {
  const styles = {
    bgColorPrimary: "",
    borderColorPrimary: "",
    txtColorPrimary: "",
    bgColorSecondary: "",
    borderColorSecondary: "",
    txtColorSecondary: "",
    bgColorTertiary: "",
    borderColorTertiary: "",
    txtColorTertiary: "",
  };
  const state =
    props.isLoading || props.disabled
      ? "disabled"
      : (stateArg as keyof typeof stylesByState);
  const stylesByState = {
    disabled: getDisabledStyles(props),
    main: getMainStateStyles(props),
    hover: getHoverStateStyles(props),
    active: getActiveStateStyles(props),
  };

  return {
    ...styles,
    ...stylesByState[state],
  };
};

const btnColorStyles = (
  props: ThemeProp & ButtonProps,
  state: string,
): BtnColorType => {
  let bgColor = "",
    txtColor = "",
    border = "";
  switch (props.category) {
    case Category.primary:
      bgColor = stateStyles(props, state).bgColorPrimary;
      txtColor = stateStyles(props, state).txtColorPrimary;
      border = `2px solid ${stateStyles(props, state).borderColorPrimary}`;
      break;
    case Category.secondary:
      bgColor = stateStyles(props, state).bgColorSecondary;
      txtColor = stateStyles(props, state).txtColorSecondary;
      border = `2px solid ${stateStyles(props, state).borderColorSecondary}`;
      break;
    case Category.tertiary:
      bgColor = stateStyles(props, state).bgColorTertiary;
      txtColor = stateStyles(props, state).txtColorTertiary;
      border = `2px solid ${stateStyles(props, state).borderColorTertiary}`;
      break;
  }
  return { bgColor, txtColor, border };
};

const getPaddingBySize = (props: ThemeProp & ButtonProps) => {
  const paddingBySize = {
    [Size.small]: `0px ${props.theme.spaces[3]}px`,
    [Size.medium]: `0px ${props.theme.spaces[7]}px`,
    [Size.large]: `0px ${props.theme.spaces[12] - 4}px`,
  };
  const paddingBySizeForJustIcon = {
    [Size.small]: `0px ${props.theme.spaces[1]}px`,
    [Size.medium]: `0px ${props.theme.spaces[2]}px`,
    [Size.large]: `0px ${props.theme.spaces[3]}px`,
  };

  const isIconOnly = !props.text && props.icon;
  const paddingConfig = isIconOnly ? paddingBySizeForJustIcon : paddingBySize;

  const iSizeInConfig =
    Object.keys(paddingConfig).indexOf(props.size || "") !== -1;
  const size: any = props.size && iSizeInConfig ? props.size : Size.small;

  return paddingConfig[size as keyof typeof paddingConfig];
};

const getHeightBySize = (props: ThemeProp & ButtonProps) => {
  const heightBySize = {
    [Size.small]: 20,
    [Size.medium]: 30,
    [Size.large]: 38,
  };

  const iSizeInConfig =
    Object.keys(heightBySize).indexOf(props.size || "") !== -1;
  const size: any = props.size && iSizeInConfig ? props.size : Size.small;

  return heightBySize[size as keyof typeof heightBySize];
};

const getBtnFontBySize = (props: ThemeProp & ButtonProps) => {
  const fontBySize = {
    [Size.small]: smallButton,
    [Size.medium]: mediumButton,
    [Size.large]: largeButton,
  };

  const iSizeInConfig =
    Object.keys(fontBySize).indexOf(props.size || "") !== -1;
  const size: any = props.size && iSizeInConfig ? props.size : Size.small;

  return fontBySize[size as keyof typeof fontBySize];
};

const btnFontStyles = (props: ThemeProp & ButtonProps): BtnFontType => {
  const padding = getPaddingBySize(props);
  const height = getHeightBySize(props);
  const buttonFont = getBtnFontBySize(props);

  return { buttonFont, padding, height };
};

const ButtonStyles = css<ThemeProp & ButtonProps>`
  width: ${(props) => (props.fill ? "100%" : "auto")};
  height: ${(props) => btnFontStyles(props).height}px;
  border: none;
  text-decoration: none;
  outline: none;
  text-transform: uppercase;
  background-color: ${(props) => btnColorStyles(props, "main").bgColor};
  color: ${(props) => btnColorStyles(props, "main").txtColor};
  border: ${(props) => btnColorStyles(props, "main").border};
  border-radius: 0;
  ${(props) => btnFontStyles(props).buttonFont};
  padding: ${(props) => btnFontStyles(props).padding};
  .${Classes.ICON} {
    margin-right: ${(props) =>
      props.text && props.icon ? `${props.theme.spaces[2] - 1}px` : `0`};
    path {
      fill: ${(props) => btnColorStyles(props, "main").txtColor};
    }
  }
  &:hover {
    text-decoration: none;
    background-color: ${(props) => btnColorStyles(props, "hover").bgColor};
    color: ${(props) => btnColorStyles(props, "hover").txtColor};
    border: ${(props) => btnColorStyles(props, "hover").border};
    cursor: ${(props) =>
      props.isLoading || props.disabled ? `not-allowed` : `pointer`};
    .${Classes.ICON} {
      margin-right: ${(props) =>
        props.text && props.icon ? `${props.theme.spaces[2] - 1}px` : `0`};
      path {
        fill: ${(props) => btnColorStyles(props, "hover").txtColor};
      }
    }
  }
  font-style: normal;
  &:active {
    background-color: ${(props) => btnColorStyles(props, "active").bgColor};
    color: ${(props) => btnColorStyles(props, "active").txtColor};
    border: ${(props) => btnColorStyles(props, "active").border};
    cursor: ${(props) =>
      props.isLoading || props.disabled ? `not-allowed` : `pointer`};
    .${Classes.ICON} {
      path {
        fill: ${(props) => btnColorStyles(props, "active").txtColor};
      }
    }
  }
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  .${Classes.SPINNER} {
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }
`;

const StyledButton = styled("button")`
  ${ButtonStyles}
`;

const StyledLinkButton = styled("a")`
  ${ButtonStyles}
`;

export const VisibilityWrapper = styled.div`
  visibility: hidden;
`;

const IconSizeProp = (size?: Size) => {
  const sizeMapping = {
    [Size.xxs]: IconSize.XXS,
    [Size.xs]: IconSize.XS,
    [Size.small]: IconSize.SMALL,
    [Size.medium]: IconSize.MEDIUM,
    [Size.large]: IconSize.LARGE,
  };

  return size ? sizeMapping[size] : IconSize.SMALL;
};

const TextLoadingState = ({ text }: { text?: string }) => (
  <VisibilityWrapper>{text}</VisibilityWrapper>
);

const IconLoadingState = ({ size, icon }: { size?: Size; icon?: IconName }) => (
  <Icon name={icon} size={IconSizeProp(size)} invisible />
);

const getIconContent = (props: ButtonProps) =>
  props.icon ? (
    props.isLoading ? (
      <IconLoadingState {...props} />
    ) : (
      <Icon name={props.icon} size={IconSizeProp(props.size)} />
    )
  ) : null;

const getTextContent = (props: ButtonProps) =>
  props.text ? (
    props.isLoading ? (
      <TextLoadingState text={props.text} />
    ) : (
      props.text
    )
  ) : null;

const getButtonContent = (props: ButtonProps) => (
  <>
    {getIconContent(props)}
    <span>{getTextContent(props)}</span>
    {props.isLoading ? <Spinner size={IconSizeProp(props.size)} /> : null}
  </>
);

const ButtonComponent = (props: ButtonProps) => (
  <StyledButton
    className={props.className}
    data-cy={props.cypressSelector}
    {...props}
    onClick={(e: React.MouseEvent<HTMLElement>) =>
      props.onClick && props.onClick(e)
    }
  >
    {getButtonContent(props)}
  </StyledButton>
);

const LinkButtonComponent = (props: ButtonProps) => (
  <StyledLinkButton
    href={props.href}
    className={props.className}
    data-cy={props.cypressSelector}
    {...props}
    onClick={(e: React.MouseEvent<HTMLElement>) =>
      props.onClick && props.onClick(e)
    }
  >
    {getButtonContent(props)}
  </StyledLinkButton>
);

const Button = (props: ButtonProps) =>
  props.tag === "button" ? (
    <ButtonComponent {...props} />
  ) : (
    <LinkButtonComponent {...props} />
  );

export default Button;

Button.defaultProps = defaultProps;
