import React from "react";
import { NavLink, useRouteMatch } from "react-router-dom";
import { MenuItem, Classes, IconName } from "@blueprintjs/core";

export type SideNavItemProps = {
  id: string;
  icon?: IconName | JSX.Element;
  text: string;
  path: string;
  loading: boolean;
};

export const SideNavItem = (props: SideNavItemProps) => {
  const match = useRouteMatch({
    path: props.path,
    exact: true,
  });
  return (
    <NavLink exact to={props.path}>
      <MenuItem
        className={props.loading ? Classes.SKELETON : undefined}
        icon={props.icon}
        active={!!match}
        text={props.text ? props.text : undefined}
        tagName="div"
      />
    </NavLink>
  );
};

export default SideNavItem;
