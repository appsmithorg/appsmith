import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import SidebarComponent from "components/editorComponents/Sidebar";
import NavBarItem from "components/editorComponents/NavBarItem";
import { EDITOR_ROUTES, BuilderRouteParams } from "constants/routes";
import { Colors } from "constants/Colors";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 5fr;
  width: ${props => props.theme.sidebarWidth};
  box-shadow: 0px 1px 3px ${Colors.MINE_SHAFT};
  background-color: ${Colors.MINE_SHAFT};
  z-index: 3;
`;

const NavBar = styled.div`
  background-color: ${Colors.MINE_SHAFT};
  color: ${props => props.theme.colors.textOnDarkBG};
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 4px ${Colors.CODE_GRAY};
`;

const EditorSidebar = styled(SidebarComponent)`
  background-color: ${Colors.MINE_SHAFT};
`;

const Sidebar = () => {
  const params = useParams<BuilderRouteParams>();

  return (
    <Wrapper>
      <NavBar>
        {EDITOR_ROUTES.map(config => (
          <NavBarItem
            key={config.title}
            {...config}
            width={16}
            height={16}
            path={config.path(params.applicationId, params.pageId)}
          />
        ))}
      </NavBar>
      <EditorSidebar />
    </Wrapper>
  );
};

Sidebar.whyDidYouRender = {
  logOnDifferentValues: false,
  customName: "MainSidebar",
};

export default Sidebar;
