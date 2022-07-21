import React, { CSSProperties, JSXElementConstructor } from "react";
import { Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as InfoIcon } from "assets/icons/form/info-outline.svg";
import { ReactComponent as HelpIcon } from "assets/icons/form/help-outline.svg";
import { ReactComponent as AddNewIcon } from "assets/icons/form/add-new.svg";
import { ReactComponent as LockIcon } from "assets/icons/form/lock.svg";

import DeleteIcon from "remixicon-react/DeleteBinLineIcon";

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
