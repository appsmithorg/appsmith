import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import SidebarComponent from "components/editorComponents/Sidebar";
import NavBarItem from "components/editorComponents/NavBarItem";
import { EDITOR_ROUTES, BuilderRouteParams } from "constants/routes";
import { checkForFlag } from "utils/featureFlags";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 4fr;
  width: ${props => props.theme.sidebarWidth};
  box-shadow: 0px 1px 3px ${props => props.theme.colors.paneBG};
  z-index: 2;
`;

const NavBar = styled.div`
  background-color: ${props => props.theme.colors.navBG};
  color: ${props => props.theme.colors.textOnDarkBG};
`;

const EditorSidebar = styled(SidebarComponent)`
  background-color: ${props => props.theme.colors.paneBG};
`;

const allowedRoutes = EDITOR_ROUTES.filter(route => {
  if (route.flag) return checkForFlag(route.flag);
  return true;
});

const Sidebar = () => {
  const params = useParams<BuilderRouteParams>();
  return (
    <Wrapper>
      <NavBar>
        {allowedRoutes.map(config => (
          <NavBarItem
            key={config.title}
            {...config}
            path={config.path(params.applicationId, params.pageId)}
          />
        ))}
      </NavBar>
      <EditorSidebar />
    </Wrapper>
  );
};

export default Sidebar;
