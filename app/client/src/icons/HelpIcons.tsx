import React, { JSXElementConstructor } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as UpdatesIcon } from "assets/icons/help/updates.svg";
import { Icon } from "@blueprintjs/core";
import GithubIcon from "remixicon-react/GithubFillIcon";
import DocumentIcon from "remixicon-react/FileTextFillIcon";
import HelpIcon from "remixicon-react/QuestionMarkIcon";
import DiscordIcon from "remixicon-react/DiscordFillIcon";
import OpenLinkIcon from "remixicon-react/ShareBoxLineIcon";

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
  CLOSE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon icon={"cross"} />
    </IconWrapper>
  ),
  GITHUB: (props: IconProps) => (
    <IconWrapper {...props}>
      <GithubIcon />
    </IconWrapper>
  ),
  CHAT: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon icon={"chat"} />
    </IconWrapper>
  ),
  DISCORD: (props: IconProps) => (
    <IconWrapper {...props}>
      <DiscordIcon />
    </IconWrapper>
  ),
  UPDATES: (props: IconProps) => (
    <IconWrapper {...props}>
      <UpdatesIcon />
    </IconWrapper>
  ),
};

export type HelpIconName = keyof typeof HelpIcons;
