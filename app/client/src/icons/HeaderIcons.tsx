import React, { JSXElementConstructor } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import ShareIcon from "remixicon-react/ShareBoxFillIcon";
import DeployIcon from "remixicon-react/Rocket2FillIcon";
import FeedbackIcon from "remixicon-react/FeedbackFillIcon";
import SaveFailureIcon from "remixicon-react/ErrorWarningFillIcon";
import SaveSuccessIcon from "remixicon-react/CheckboxCircleFillIcon";
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
