import React from "react";
import styled from "styled-components";
import { Menu, Button } from "@blueprintjs/core";
import SideNavItem, { SideNavItemProps } from "./SideNavItem";
import LetterIcon from "components/editorComponents/LetterIcon";
type SideNavProps = {
  items?: SideNavItemProps[];
  active?: string;
  headeroffset?: number;
  open: boolean;
  toggleCollapse: (open: boolean) => void;
};

/* eslint-disable no-unexpected-multiline */

const SideNavWrapper = styled.div<{
  open: boolean;
  headeroffset?: number;
}>`
  &&& {
    width: ${(props) =>
      props.open
        ? props.theme.sideNav.maxWidth
        : props.theme.sideNav.minWidth}px;
    transition: width 0.2s ease-in;
    height: 100%;
    & ul {
      min-width: ${(props) => props.theme.sideNav.minWidth}px;
      overflow-y: auto;
      & a {
        text-decoration: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
      }
      & li > div {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 ${(props) => (props.open ? props.theme.spaces[6] : 0)}px;
        height: ${(props) => props.theme.sideNav.navItemHeight}px;
        text-transform: capitalize;
        & > span {
          margin-right: ${(props) =>
            props.open ? props.theme.spaces[3] : 0}px;
        }
      }
    }
  }
`;

const ToggleButton = styled(Button)<{
  open: boolean;
  headeroffset?: number;
}>`
  && {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    width: ${(props) =>
      props.open
        ? props.theme.sideNav.maxWidth
        : props.theme.sideNav.minWidth}px;
    height: ${(props) => props.headeroffset || 50}px;
    justify-content: flex-end;
    padding-right: ${(props) => props.theme.sideNav.minWidth / 2}px;
    transition: width 0.1s ease-in;
  }
`;

export function SideNav(props: SideNavProps) {
  const { open, toggleCollapse } = props;
  const renderItems = (sideNavItems?: SideNavItemProps[]) => {
    let items = sideNavItems;
    if (!items) {
      items = [
        { id: "0", text: "", path: "", loading: true, showText: true },
        { id: "1", text: "", path: "", loading: true, showText: true },
        { id: "2", text: "", path: "", loading: true, showText: true },
      ];
    }
    return items.map((item) => {
      const icon =
        item.text.length > 0 ? (
          <LetterIcon
            text={String.fromCodePoint(item.text.codePointAt(0) || 0)}
          />
        ) : null;
      return (
        <SideNavItem key={item.id} showText={open} {...item} icon={icon} />
      );
    });
  };

  return (
    <SideNavWrapper headeroffset={props.headeroffset} open={open}>
      <ToggleButton
        className="sidenav-toggle"
        headeroffset={props.headeroffset}
        icon={open ? "double-chevron-left" : "menu"}
        minimal
        onClick={() => {
          toggleCollapse(!open);
        }}
        open={open}
      />
      <Menu large>{renderItems(props.items)}</Menu>
    </SideNavWrapper>
  );
}

export default SideNav;
