import React from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as WidgetsIcon } from "assets/icons/menu/widgets.svg";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api.svg";
import { ReactComponent as OrgIcon } from "assets/icons/menu/org.svg";
import { ReactComponent as OverflowMenuIcon } from "assets/icons/menu/overflow-menu.svg";
/* eslint-disable react/display-name */

export const MenuIcons: {
  [id: string]: Function;
} = {
  WIDGETS_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <WidgetsIcon />
    </IconWrapper>
  ),
  APIS_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <ApisIcon />
    </IconWrapper>
  ),
  ORG_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <OrgIcon />
    </IconWrapper>
  ),
};
