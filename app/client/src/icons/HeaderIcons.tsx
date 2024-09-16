import type { JSXElementConstructor } from "react";
import React from "react";
import type { IconProps } from "constants/IconConstants";
import { IconWrapper } from "constants/IconConstants";
import { importRemixIcon } from "@appsmith/ads-old";

const ShareIcon = importRemixIcon(
  async () => import("remixicon-react/ShareBoxFillIcon"),
);
const DeployIcon = importRemixIcon(
  async () => import("remixicon-react/Rocket2FillIcon"),
);
const FeedbackIcon = importRemixIcon(
  async () => import("remixicon-react/FeedbackFillIcon"),
);
const SaveFailureIcon = importRemixIcon(
  async () => import("remixicon-react/ErrorWarningFillIcon"),
);
const SaveSuccessIcon = importRemixIcon(
  async () => import("remixicon-react/CheckboxCircleFillIcon"),
);
/* eslint-disable react/display-name */

export const HeaderIcons: {
  [id: string]: JSXElementConstructor<IconProps>;
} = {
  SHARE: (props: IconProps) => (
    <IconWrapper {...props}>
      <ShareIcon />
    </IconWrapper>
  ),
  DEPLOY: (props: IconProps) => (
    <IconWrapper {...props}>
      <DeployIcon />
    </IconWrapper>
  ),
  FEEDBACK: (props: IconProps) => (
    <IconWrapper {...props}>
      <FeedbackIcon />
    </IconWrapper>
  ),
  SAVE_FAILURE: (props: IconProps) => (
    <IconWrapper {...props}>
      <SaveFailureIcon />
    </IconWrapper>
  ),
  SAVE_SUCCESS: (props: IconProps) => (
    <IconWrapper {...props}>
      <SaveSuccessIcon />
    </IconWrapper>
  ),
};

export type HeaderIconName = keyof typeof HeaderIcons;
