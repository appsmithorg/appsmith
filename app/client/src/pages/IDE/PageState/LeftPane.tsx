import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { importSvg } from "design-system-old";
import { matchPath, Switch } from "react-router";
import {
  IDE_PAGE_JS_DETAIL_PATH,
  IDE_PAGE_JS_PATH,
  IDE_PAGE_NAV_PATH,
  IDE_PAGE_PATH,
  IDE_PAGE_QUERIES_DETAIL_PATH,
  IDE_PAGE_QUERIES_PATH,
  IDE_PAGE_UI_DETAIL_PATH,
  IDE_PAGE_UI_PATH,
} from "../../../constants/routes";
import classNames from "classnames";
import history from "../../../utils/history";
import { pageEntityUrl } from "../../../RouteBuilder";
import { useDispatch } from "react-redux";
import { SentryRoute } from "@appsmith/AppRouter";
import WidgetSidebar from "./components/WidgetSidebar";
import { setIdeSidebarWidth } from "../ideActions";
import QuerySidebar from "./components/QuerySidebar";
import JSObjects from "./components/JSObjects";
import { useIDENavState } from "../hooks";
import useWindowDimensions from "../../../utils/hooks/useWindowDimensions";
import PropertyPane from "./components/PropertyPane";
import { PageNavState } from "../ideReducer";

const Container = styled.div`
  background-color: #f1f5f9;
  display: grid;
  grid-template-rows: 40px 1fr;
  grid-gap: 4px;
  height: 100%;
`;

const PageLevelContainer = styled.div`
  display: grid;
  grid-template-rows: 40px 1fr;
  grid-gap: 4px;
`;

const PageNav = styled.div`
  background-color: white;
  border-radius: 4px;
  display: grid;
  grid-template-columns: 95px 95px 95px;
  padding: 5px;
  grid-gap: 2px;
`;

const TabContainer = styled.div`
  background-color: white;
  border-radius: 4px;
  height: calc(100vh - 44px - 44px - 40px);
`;

const NavPill = styled.div`
  display: grid;
  align-items: center;
  justify-content: center;
  grid-gap: 2px;
  border-radius: 4px;
  grid-template-columns: 24px auto;
  &:hover {
    cursor: pointer;
    background-color: #f1f5f9;
  }
  svg {
    height: 24px;
    width: 24px;
  }
  &.selected {
    background: #fbe6dc;
  }
`;

const QueriesIcon = importSvg(
  () => import("pages/IDE/assets/icons/queries.svg"),
);

const JSIcon = importSvg(() => import("pages/IDE/assets/icons/js.svg"));

const UIIcon = importSvg(() => import("pages/IDE/assets/icons/ui.svg"));

const PageLeftPane = () => {
  const dispatch = useDispatch();
  const matchParams = matchPath<{ pageNav: string; pageId: string }>(
    window.location.pathname,
    {
      path: [IDE_PAGE_NAV_PATH, IDE_PAGE_PATH],
    },
  );
  const [navState] = useIDENavState();
  const [width] = useWindowDimensions();

  useEffect(() => {
    const { pageNav } = navState;
    if (pageNav) {
      if (pageNav === PageNavState.UI) {
        dispatch(setIdeSidebarWidth(300));
      } else if (
        pageNav === PageNavState.JS ||
        pageNav === PageNavState.QUERIES
      ) {
        const sidebarWidth = (width - 50) * 0.4;
        dispatch(setIdeSidebarWidth(sidebarWidth));
      }
    }
  }, [navState.pageNav]);

  const navigatePageEntity = useCallback(
    (location: PageNavState) => {
      if (location !== matchParams?.params.pageNav) {
        history.push(
          pageEntityUrl({ pageId: matchParams?.params.pageId || "" }, location),
        );
      }
    },
    [location.pathname],
  );

  return (
    <Container>
      <PageLevelContainer>
        <PageNav>
          <NavPill
            className={classNames({
              selected: matchParams?.params.pageNav === PageNavState.QUERIES,
            })}
            onClick={() => navigatePageEntity(PageNavState.QUERIES)}
          >
            <QueriesIcon />
            Queries
          </NavPill>
          <NavPill
            className={classNames({
              selected: matchParams?.params.pageNav === PageNavState.JS,
            })}
            onClick={() => navigatePageEntity(PageNavState.JS)}
          >
            <JSIcon />
            JS
          </NavPill>
          <NavPill
            className={classNames({
              selected: matchParams?.params.pageNav === PageNavState.UI,
            })}
            onClick={() => navigatePageEntity(PageNavState.UI)}
          >
            <UIIcon />
            UI
          </NavPill>
        </PageNav>
        <TabContainer>
          <Switch>
            <SentryRoute
              component={PropertyPane}
              exact
              path={IDE_PAGE_UI_DETAIL_PATH}
            />
            <SentryRoute
              component={WidgetSidebar}
              exact
              path={IDE_PAGE_UI_PATH}
            />
            <SentryRoute
              component={QuerySidebar}
              exact
              path={IDE_PAGE_QUERIES_PATH}
            />
            <SentryRoute
              component={QuerySidebar}
              exact
              path={IDE_PAGE_QUERIES_DETAIL_PATH}
            />
            <SentryRoute component={JSObjects} exact path={IDE_PAGE_JS_PATH} />
            <SentryRoute
              component={JSObjects}
              exact
              path={IDE_PAGE_JS_DETAIL_PATH}
            />
          </Switch>
        </TabContainer>
      </PageLevelContainer>
    </Container>
  );
};

export default PageLeftPane;
