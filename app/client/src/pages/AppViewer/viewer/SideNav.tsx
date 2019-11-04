import React, { useState } from "react";
import styled from "styled-components";
import { Menu, MenuItem, IconName, Button, Icon } from "@blueprintjs/core";

export type SideNavItem = {
  id: string;
  icon?: string;
  text: string;
};

type SideNavProps = {
  items: SideNavItem[];
  active?: SideNavItem;
  onSelect: Function;
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
  const select = (item: SideNavItem) => () => {
    props.onSelect(item);
  };
  const renderItems = (items: SideNavItem[]) => {
    return items.map(item => {
      const icon = (
        <Icon iconSize={props.iconSize} icon={item.icon as IconName} />
      );
      return (
        <MenuItem
          icon={icon}
          active={props.active && item.id === props.active.id}
          key={item.id}
          onClick={select(item)}
          text={open ? item.text : undefined}
          tagName="div"
        />
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
