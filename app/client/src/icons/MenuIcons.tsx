import React from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as WidgetsIcon } from "assets/icons/menu/widgets.svg";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api.svg";
import { ReactComponent as OrgIcon } from "assets/icons/menu/org.svg";
import { ReactComponent as PagesIcon } from "assets/icons/menu/pages.svg";
import { ReactComponent as DataSourcesIcon } from "assets/icons/menu/data-sources.svg";
import { ReactComponent as QueriesIcon } from "assets/icons/menu/queries.svg";
import { ReactComponent as HomepageIcon } from "assets/icons/menu/homepage.svg";
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
  PAGES_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <PagesIcon />
    </IconWrapper>
  ),
  DATASOURCES_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DataSourcesIcon />
    </IconWrapper>
  ),
  QUERIES_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <QueriesIcon />
    </IconWrapper>
  ),
  HOMEPAGE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <HomepageIcon />
    </IconWrapper>
  ),
};
