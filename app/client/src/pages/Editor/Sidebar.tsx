import React from "react";
import styled from "styled-components";
import SidebarComponent from "../../components/editor/Sidebar";
import NavBarItem from "../../components/editor/NavBarItem";
import { EDITOR_ROUTES } from "../../constants/routes";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 4fr;
  width: ${props => props.theme.sidebarWidth};
  box-shadow: 0px 1px 3px ${props => props.theme.colors.paneBG};
`;

const NavBar = styled.div`
  background-color: ${props => props.theme.colors.navBG};
  color: ${props => props.theme.colors.textOnDarkBG};
  padding: ${props => props.theme.spaces[3]}px 0px;
`;

const EditorSidebar = styled(SidebarComponent)`
  background-color: ${props => props.theme.colors.paneBG};
`;

const Sidebar = () => {
  return (
    <Wrapper>
      <NavBar>
        {EDITOR_ROUTES.map(config => (
          <NavBarItem key={config.path} {...config} />
        ))}
      </NavBar>
      <EditorSidebar />
    </Wrapper>
  );
};

export default Sidebar;
