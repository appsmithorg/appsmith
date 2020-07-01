import React, { JSXElementConstructor } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as InfoIcon } from "assets/icons/alert/info.svg";
import { ReactComponent as SuccessIcon } from "assets/icons/alert/success.svg";
import { ReactComponent as ErrorIcon } from "assets/icons/alert/error.svg";
import { ReactComponent as WarningIcon } from "assets/icons/alert/warning.svg";

/* eslint-disable react/display-name */

export const AlertIcons: {
  [id: string]: JSXElementConstructor<IconProps>;
} = {
  INFO: (props: IconProps) => (
    <IconWrapper {...props}>
      <InfoIcon />
    </IconWrapper>
  ),
  SUCCESS: (props: IconProps) => (
    <IconWrapper {...props}>
      <SuccessIcon />
    </IconWrapper>
  ),
  ERROR: (props: IconProps) => (
    <IconWrapper {...props}>
      <ErrorIcon />
    </IconWrapper>
  ),
  WARNING: (props: IconProps) => (
    <IconWrapper {...props}>
      <WarningIcon />
    </IconWrapper>
  ),
};

export type AlertIconName = keyof typeof AlertIcons;
