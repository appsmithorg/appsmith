import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { importSvg } from "design-system-old";
import { matchPath, Switch } from "react-router";
import {
  IDE_PAGE_NAV_PATH,
  IDE_PAGE_PATH,
  IDE_PAGE_QUERIES_DETAIL_PATH,
  IDE_PAGE_QUERIES_PATH,
  IDE_PAGE_UI_DETAIL_PATH,
  IDE_PAGE_UI_PATH,
} from "../../../constants/routes";
import classNames from "classnames";
import history, { NavigationMethod } from "../../../utils/history";
import { builderURL, pageEntityUrl } from "../../../RouteBuilder";
import PageSwitcher from "./PageSwitcher";
import {
  createNewPageFromEntities,
  fetchPage,
  updateCurrentPage,
} from "../../../actions/pageActions";
import Entity from "pages/Editor/Explorer/Entity";
import { getNextEntityName } from "../../../utils/AppsmithUtils";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "../../../selectors/editorSelectors";
import { selectAllPages } from "../../../selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { Icon } from "design-system";
import { defaultPageIcon, pageIcon } from "../../Editor/Explorer/ExplorerIcons";
import { toggleInOnboardingWidgetSelection } from "../../../actions/onboardingActions";
import { IDEAppState } from "../ideReducer";
import { SentryRoute } from "@appsmith/AppRouter";
import PropertyPaneContainer from "../../Editor/WidgetsEditor/PropertyPaneContainer";
import WidgetSidebar from "./components/WidgetSidebar";
import QuerySidebar from "./components/QuerySidebar";

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
  height: calc(100vh - 200px);
  overflow-y: scroll;
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

const PageList = styled.div`
  height: 100%;
  background-color: white;
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
  const currentPageId = useSelector(getCurrentPageId);

  const navigatePageEntity = useCallback(
    (location: string) => {
      history.push(
        pageEntityUrl({ pageId: matchParams?.params.pageId || "" }, location),
      );
    },
    [location.pathname],
  );

  const [isSwitchMode, setSwitchMode] = useState(false);
  const applicationId = useSelector(getCurrentApplicationId);
  const pages: Page[] = useSelector(selectAllPages);
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const instanceId = useSelector(getInstanceId);
  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );

    dispatch(
      createNewPageFromEntities(
        applicationId,
        name,
        workspaceId,
        false,
        instanceId,
      ),
    );
  }, [dispatch, pages, applicationId]);
  const switchPage = useCallback(
    (page: Page) => {
      const navigateToUrl = builderURL({
        pageId: page.pageId,
        ideState: IDEAppState.Page,
        suffix: "/ui",
      });
      dispatch(toggleInOnboardingWidgetSelection(true));
      dispatch(updateCurrentPage(page.pageId));
      dispatch(fetchPage(page.pageId));
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EntityExplorer,
      });
    },
    [location.pathname],
  );

  return (
    <Container>
      <PageSwitcher isSwitchMode={isSwitchMode} setSwitchMode={setSwitchMode} />
      {isSwitchMode && (
        <PageList>
          <Entity
            action={createPageCallback}
            canEditEntityName={false}
            className={`page`}
            entityId={"new"}
            icon={<Icon name="plus" />}
            name={"New Page"}
            searchKeyword={""}
            step={1}
          />
          {pages.map((page) => {
            const icon = page.isDefault ? defaultPageIcon : pageIcon;
            const isCurrentPage = currentPageId === page.pageId;
            return (
              <Entity
                action={() => switchPage(page)}
                active={isCurrentPage}
                canEditEntityName={false}
                className={`page ${isCurrentPage && "activePage"}`}
                disabled={page.isHidden}
                entityId={"new"}
                icon={icon}
                key={page.pageId}
                name={page.pageName}
                step={1}
              />
            );
          })}
        </PageList>
      )}
      {!isSwitchMode && (
        <PageLevelContainer>
          <PageNav>
            <NavPill
              className={classNames({
                selected: matchParams?.params.pageNav === "queries",
              })}
              onClick={() => navigatePageEntity("queries")}
            >
              <QueriesIcon />
              Queries
            </NavPill>
            <NavPill
              className={classNames({
                selected: matchParams?.params.pageNav === "js",
              })}
              onClick={() => navigatePageEntity("js")}
            >
              <JSIcon />
              JS
            </NavPill>
            <NavPill
              className={classNames({
                selected: matchParams?.params.pageNav === "ui",
              })}
              onClick={() => navigatePageEntity("ui")}
            >
              <UIIcon />
              UI
            </NavPill>
          </PageNav>
          <TabContainer>
            <Switch>
              <SentryRoute
                component={PropertyPaneContainer}
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
            </Switch>
          </TabContainer>
        </PageLevelContainer>
      )}
    </Container>
  );
};

export default PageLeftPane;
