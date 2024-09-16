import type { CSSProperties, JSXElementConstructor } from "react";
import React from "react";
import { Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import type { IconProps } from "constants/IconConstants";
import { IconWrapper } from "constants/IconConstants";
import { importRemixIcon, importSvg } from "@appsmith/ads-old";

const InfoIcon = importSvg(
  async () => import("assets/icons/form/info-outline.svg"),
);
const HelpIcon = importSvg(
  async () => import("assets/icons/form/help-outline.svg"),
);
const AddNewIcon = importSvg(
  async () => import("assets/icons/form/add-new.svg"),
);
const LockIcon = importSvg(async () => import("assets/icons/form/lock.svg"));
const DeleteIcon = importRemixIcon(
  async () => import("remixicon-react/DeleteBinLineIcon"),
);

/* eslint-disable react/display-name */

export const FormIcons: {
  [id: string]: JSXElementConstructor<IconProps & { style?: CSSProperties }>;
} = {
  INFO_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <InfoIcon />
    </IconWrapper>
  ),
  HELP_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <HelpIcon />
    </IconWrapper>
  ),
  HOME_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon color={props.color} icon={IconNames.HOME} iconSize={props.height} />
    </IconWrapper>
  ),
  DELETE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DeleteIcon />
    </IconWrapper>
  ),
  ADD_NEW_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <AddNewIcon />
    </IconWrapper>
  ),
  CREATE_NEW_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon icon={IconNames.PLUS} />
    </IconWrapper>
  ),
  PLUS_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon color={props.color} icon={IconNames.PLUS} iconSize={props.height} />
    </IconWrapper>
  ),
  SLASH_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon
        color={props.color}
        icon={IconNames.SLASH}
        iconSize={props.height}
      />
    </IconWrapper>
  ),
  LOCK_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <LockIcon />
    </IconWrapper>
  ),
};
