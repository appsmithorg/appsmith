import React from "react";
import styled from "styled-components";
import NavBarItem from "./NavBarItem";
import { MenuIcons } from "../icons/MenuIcons";
import { BUILDER_URL, API_EDITOR_URL } from "../constants/routes";
import Sidebar from "./Sidebar";

const Container = styled.div`
  height: calc(100vh - ${props => props.theme.headerHeight});
  display: flex;
  box-shadow: 0px 1px 3px ${props => props.theme.colors.paneBG};
  z-index: 30;
  width: ${props => props.theme.sidebarWidth};
`;

const NavBarContainer = styled.div`
  flex: 2;
  background-color: ${props => props.theme.colors.navBG};
  color: ${props => props.theme.colors.textOnDarkBG};
  padding: ${props => props.theme.spaces[3]}px 0px;
`;

const ROUTES = [
  {
    icon: MenuIcons.WIDGETS_ICON,
    path: BUILDER_URL,
    title: "Widgets",
  },
  {
    icon: MenuIcons.APIS_ICON,
    path: API_EDITOR_URL,
    title: "APIs",
  },
];

class NavBar extends React.Component {
  render(): React.ReactNode {
    return (
      <Container>
        <NavBarContainer>
          {ROUTES.map(config => (
            <NavBarItem key={config.path} {...config} />
          ))}
        </NavBarContainer>
        <Sidebar />
      </Container>
    );
  }
}

export default NavBar;
