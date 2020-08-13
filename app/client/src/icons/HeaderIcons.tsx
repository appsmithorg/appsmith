import React, { JSXElementConstructor } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as ShareIcon } from "assets/icons/header/share-white.svg";
import { ReactComponent as DeployIcon } from "assets/icons/header/deploy.svg";
import { ReactComponent as FeedbackIcon } from "assets/icons/header/feedback.svg";
import { ReactComponent as SaveFailureIcon } from "assets/icons/header/save-failure.svg";
import { ReactComponent as SaveSuccessIcon } from "assets/icons/header/save-success.svg";
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
