import type { JSXElementConstructor } from "react";
import React from "react";
import type { IconProps } from "constants/IconConstants";
import { IconWrapper } from "constants/IconConstants";
import { importSvg } from "@appsmith/ads-old";

const InfoIcon = importSvg(async () => import("assets/icons/alert/info.svg"));
const SuccessIcon = importSvg(
  async () => import("assets/icons/alert/success.svg"),
);
const ErrorIcon = importSvg(async () => import("assets/icons/alert/error.svg"));
const WarningIcon = importSvg(
  async () => import("assets/icons/alert/warning.svg"),
);

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
