import React from "react";
import { Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as DeleteIcon } from "assets/icons/form/trash.svg";
import { ReactComponent as AddNewIcon } from "assets/icons/form/add-new.svg";

/* eslint-disable react/display-name */

export const FormIcons: {
  [id: string]: Function;
} = {
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
  PLUS_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon icon={IconNames.PLUS} color={props.color} iconSize={props.height} />
    </IconWrapper>
  ),
  SLASH_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon
        icon={IconNames.SLASH}
        color={props.color}
        iconSize={props.height}
      />
    </IconWrapper>
  ),
};
