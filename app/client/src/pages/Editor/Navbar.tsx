import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import SidebarComponent from "components/editorComponents/Sidebar";
import NavBarItem from "components/editorComponents/NavBarItem";
import {
  BuilderRouteParams,
  BUILDER_PAGE_URL,
  WIDGETS_URL,
} from "constants/routes";
import { Colors } from "constants/Colors";
import { MenuIcons } from "icons/MenuIcons";

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

const Navbar = () => {
  const params = useParams<BuilderRouteParams>();

  return (
    <Wrapper>
      <NavBar>
        <NavBarItem
          icon={MenuIcons.EXPLORER_ICON}
          path={BUILDER_PAGE_URL(params.applicationId, params.pageId)}
          width={16}
          height={16}
          className="t--nav-link-entity-explorer"
          title="Explorer"
          isActive={(expected: string, current: string) => {
            // Currently, the explorer shows on all paths except for the
            // WIDGETS_URL path

            // get the applicationId and pageId from the current location pathname
            const found = current.match(
              /^\/applications\/(?<applicationId>\w+)\/pages\/(?<pageId>\w+)\//,
            );
            // In this case: expected = BUILDER_PAGE_URL(applicationId, pageId)
            // If current url begins with expected url AND
            // If the current url isn't the WIDGETS_URL THEN
            // this is an explorer sidebar path
            return (
              current.indexOf(expected) === 0 &&
              current !==
                WIDGETS_URL(found?.groups?.applicationId, found?.groups?.pageId)
            );
          }}
        />
        <NavBarItem
          icon={MenuIcons.WIDGETS_ICON}
          path={WIDGETS_URL(params.applicationId, params.pageId)}
          width={16}
          height={16}
          className="t--nav-link-widgets-editor"
          title="Widgets"
          exact
          isActive={(expected: string, current: string) => expected === current}
        />
      </NavBar>
      <SidebarComponent />
    </Wrapper>
  );
};
Navbar.displayName = "Navbar";

Navbar.whyDidYouRender = {
  logOnDifferentValues: false,
  customName: "MainSidebar",
};

export default Navbar;
