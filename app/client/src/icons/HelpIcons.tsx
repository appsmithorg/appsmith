import type { JSXElementConstructor } from "react";
import React from "react";
import type { IconProps } from "constants/IconConstants";
import { IconWrapper } from "constants/IconConstants";
import { Icon } from "@blueprintjs/core";
import { importRemixIcon, importSvg } from "@appsmith/ads-old";

const UpdatesIcon = importSvg(
  async () => import("assets/icons/help/updates.svg"),
);
const GithubIcon = importRemixIcon(
  async () => import("remixicon-react/GithubFillIcon"),
);
const DocumentIcon = importRemixIcon(
  async () => import("remixicon-react/FileTextFillIcon"),
);
const HelpIcon = importRemixIcon(
  async () => import("remixicon-react/QuestionMarkIcon"),
);
const DiscordIcon = importRemixIcon(
  async () => import("remixicon-react/DiscordFillIcon"),
);
const OpenLinkIcon = importRemixIcon(
  async () => import("remixicon-react/ShareBoxLineIcon"),
);
const FileCopyLineIcon = importRemixIcon(
  async () => import("remixicon-react/FileCopyLineIcon"),
);

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
  COPY_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <FileCopyLineIcon />
    </IconWrapper>
  ),
};

export type HelpIconName = keyof typeof HelpIcons;
