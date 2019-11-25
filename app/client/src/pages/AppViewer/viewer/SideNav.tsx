import React, { useState } from "react";
import styled from "styled-components";
import {
  Menu,
  MenuItem,
  IconName,
  Button,
  Icon,
  Classes,
} from "@blueprintjs/core";
import { Link } from "react-router-dom";

export type SideNavItem = {
  id: string;
  icon?: string;
  text: string;
  path: string;
};

type SideNavProps = {
  items?: SideNavItem[];
  active?: string;
  headeroffset?: number;
  iconSize?: number;
};

/* eslint-disable no-unexpected-multiline */

const SideNavWrapper = styled.div<{
  open: boolean;
  headeroffset?: number;
}>`
  &&& {
    width: ${props =>
      props.open
        ? props.theme.sideNav.maxWidth
        : props.theme.sideNav.minWidth}px;
    transition: width 0.5s ease-out;
    height: 100%;
    & ul {
      min-width: ${props => props.theme.sideNav.minWidth}px;
      overflow-y: auto;
      & li > div {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        height: ${props => props.theme.sideNav.navItemHeight}px;
        text-transform: capitalize;
        & > div {
          flex-grow: 0;
          display: inline;
          width: ${props => (props.open ? 100 : 0)}px;
          color: ${props => props.theme.sideNav.fontColor};
        }
        & > span {
          margin-right: ${props => (props.open ? props.theme.spaces[3] : 0)}px;
        }
      }
    }
  }
`;

const ToggleButton = styled(Button)<{
  open: boolean;
  headeroffset?: number;
}>`
  position: fixed;
  top: 0;
  left: 0;
  width: ${props =>
    props.open ? props.theme.sideNav.maxWidth : props.theme.sideNav.minWidth}px;
  height: ${props => props.headeroffset || 50}px;
  justify-content: flex-end;
  padding-right: ${props => props.theme.sideNav.minWidth / 2}px;
  transition: width 0.5s ease-out;
`;

export const SideNav = (props: SideNavProps) => {
  const [open, setopen] = useState(true);
  const renderItems = (sideNavItems?: SideNavItem[]) => {
    let items = sideNavItems;
    if (!items) {
      items = [
        { id: "0", text: "", path: "" },
        { id: "1", text: "", path: "" },
        { id: "2", text: "", path: "" },
      ];
    }
    return items.map(item => {
      const icon = (
        <Icon iconSize={props.iconSize} icon={item.icon as IconName} />
      );
      return (
        <Link to={item.path} key={item.id}>
          <MenuItem
            className={!sideNavItems ? Classes.SKELETON : undefined}
            icon={icon}
            active={props.active === item.id}
            text={open ? item.text : undefined}
            tagName="div"
          />
        </Link>
      );
    });
  };
  const toggleCollapse = () => {
    setopen(!open);
  };

  return (
    <SideNavWrapper open={open} headeroffset={props.headeroffset}>
      <ToggleButton
        headeroffset={props.headeroffset}
        onClick={toggleCollapse}
        rightIcon={open ? "cross" : "menu"}
        minimal
        open={open}
        className="sidenav-toggle"
      ></ToggleButton>
      <Menu large>{renderItems(props.items)}</Menu>
    </SideNavWrapper>
  );
};

export default SideNav;
