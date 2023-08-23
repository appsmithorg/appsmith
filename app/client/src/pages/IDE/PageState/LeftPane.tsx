import React, { useCallback } from "react";
import styled from "styled-components";
import { importSvg } from "design-system-old";
import { matchPath } from "react-router";
import { IDE_PAGE_NAV_PATH } from "../../../constants/routes";
import classNames from "classnames";
import history from "../../../utils/history";
import { pageEntityUrl } from "../../../RouteBuilder";

const Container = styled.div`
  background-color: #f1f5f9;
  display: grid;
  grid-template-rows: 50px 1fr;
  grid-gap: 4px;
  height: 100%;
`;

const PageNav = styled.div`
  background-color: white;
  border-radius: 4px;
  display: grid;
  grid-template-columns: 95px 95px 95px;
  padding: 5px;
`;

const TabContainer = styled.div`
  background-color: white;
  border-radius: 4px;
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
  const matchParams = matchPath<{ pageNav: string; pageId: string }>(
    window.location.pathname,
    {
      path: IDE_PAGE_NAV_PATH,
    },
  );

  const navigatePageEntity = useCallback((location: string) => {
    history.push(
      pageEntityUrl({ pageId: matchParams?.params.pageId || "" }, location),
    );
  }, []);

  return (
    <Container>
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
      <TabContainer />
    </Container>
  );
};

export default PageLeftPane;
