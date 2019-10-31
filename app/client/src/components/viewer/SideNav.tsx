import React, { useState } from "react";
import styled from "styled-components";
import { Menu, MenuItem, IconName, Button } from "@blueprintjs/core";

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
};

/* eslint-disable no-unexpected-multiline */

const SideNavWrapper = styled.div<{
  isExpanded: boolean;
  headeroffset?: number;
}>`
  height: calc(100vh - ${props => props.headeroffset || 50}px);
  margin-top: ${props => props.headeroffset || 50}px;
  width: ${props =>
    props.isExpanded
      ? props.theme.sideNav.maxWidth
      : props.theme.sideNav.minWidth}px;
  transition: width 0.5s ease-out;
`;

const ToggleButton = styled(Button)<{ headeroffset?: number }>`
  position: fixed;
  top: 0;
  left: 0;
  width: ${props => props.headeroffset || 50}px;
  height: ${props => props.headeroffset || 50}px;
`;

export const SideNav = (props: SideNavProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const select = (item: SideNavItem) => () => {
    props.onSelect(item);
  };
  const renderItems = (items: SideNavItem[]) => {
    return items.map(item => {
      return (
        <MenuItem
          icon={item.icon as IconName}
          active={props.active && item.id === props.active.id}
          key={item.id}
          onClick={select(item)}
          text={item.text}
        />
      );
    });
  };
  const toggleCollapse = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <SideNavWrapper isExpanded={isExpanded} headeroffset={props.headeroffset}>
      <ToggleButton
        headeroffset={props.headeroffset}
        onClick={toggleCollapse}
        icon={isExpanded ? "cross" : "menu"}
        minimal
      ></ToggleButton>
      <Menu>{renderItems(props.items)}</Menu>
    </SideNavWrapper>
  );
};

export default SideNav;
