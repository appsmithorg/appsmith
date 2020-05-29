import React, { JSXElementConstructor } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as OpenLinkIcon } from "assets/icons/help/openlink.svg";
import { ReactComponent as DocumentIcon } from "assets/icons/help/document.svg";
import { ReactComponent as HelpIcon } from "assets/icons/help/help.svg";

/* eslint-disable react/display-name */

export const HelpIcons: {
  [id: string]: JSXElementConstructor<IconProps>;
} = {
  OPEN_LINK: (props: IconProps) => (
    <IconWrapper {...props}>
      <OpenLinkIcon />
    </IconWrapper>
  ),
  DOCUMENT: (props: IconProps) => (
    <IconWrapper {...props}>
      <DocumentIcon />
    </IconWrapper>
  ),
  HELP_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <HelpIcon />
    </IconWrapper>
  ),
};

export type HelpIconName = keyof typeof HelpIcons;
