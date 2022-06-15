import React, { useMemo } from "react";
import { IconName } from "@blueprintjs/icons";
import { withTooltip } from "components/wds";

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
import { getButtonStyles, getCSSVariables, getVariantStyles } from "./styles";

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

export interface ButtonProps extends ButtonStyleProps, RecaptchaProps {
  variant?: keyof typeof VariantTypes;
  boxShadow?: string;
  borderRadius?: string;
  tooltip?: string;
  children?: React.ReactNode;
  leftIcon?: IconName;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export enum VariantTypes {
  solid = "solid",
  outline = "outline",
  ghost = "ghost",
  link = "link",
}

function Button(props: ButtonProps) {
  const {
    borderRadius,
    boxShadow,
    buttonColor,
    buttonVariant,
    className,
    isDisabled,
    variant,
    ...rest
  } = props;

  const computedClassnames = useMemo(() => {
    return [getVariantStyles(variant), getButtonStyles(props), className].join(
      " ",
    );
  }, [variant, className, isDisabled]);

  const cssVariables = useMemo(() => {
    return getCSSVariables(props, "default");
  }, [borderRadius, buttonColor]);

  return (
    <button {...rest} className={computedClassnames} style={cssVariables} />
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
