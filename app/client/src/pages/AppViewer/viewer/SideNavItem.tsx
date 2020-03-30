import React, { ReactNode } from "react";
import styled from "styled-components";
import { NavLink, useRouteMatch } from "react-router-dom";
import { MenuItem, Classes } from "@blueprintjs/core";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Content = styled.div<{ collapsed: boolean }>`
  display: flex;
  justify-content: ${props => (props.collapsed ? "center" : "flex-start")};
  align-items: center;
  & > div:first-of-type {
    margin-right: ${props => (props.collapsed ? 0 : props.theme.spaces[5])}px;
  }
`;

export type SideNavItemProps = {
  id: string;
  icon?: ReactNode;
  text: string;
  path: string;
  loading: boolean;
  showText?: boolean;
};

export const SideNavItem = (props: SideNavItemProps) => {
  const match = useRouteMatch({
    path: props.path,
    exact: true,
  });
  const menuItemContent = (
    <Content collapsed={!props.showText}>
      {props.icon}
      {props.showText ? props.text : null}
    </Content>
  );

  return (
    <NavLink
      exact
      to={props.path}
      onClick={() => {
        AnalyticsUtil.logEvent("PAGE_SWITCH", {
          pageName: props.text,
          pageId: props.id,
          mode: "VIEW",
        });
      }}
    >
      <MenuItem
        className={
          props.loading
            ? Classes.SKELETON
            : `${Classes.FILL} t--page-nav-${props.text}`
        }
        active={!!match}
        text={menuItemContent}
        tagName="div"
      />
    </NavLink>
  );
};

export default SideNavItem;
