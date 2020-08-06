import React, { JSXElementConstructor } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as ShareIcon } from "assets/icons/header/share-white.svg";
/* eslint-disable react/display-name */

export const HeaderIcons: {
  [id: string]: JSXElementConstructor<IconProps>;
} = {
  SHARE: (props: IconProps) => (
    <IconWrapper {...props}>
      <ShareIcon />
    </IconWrapper>
  ),
};

export type HeaderIconName = keyof typeof HeaderIcons;
