import React, { useEffect, useState } from "react";
import { useRouteMatch, Route, Switch } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { Classes } from "@blueprintjs/core";
import { TabComponent, DefaultTabItem } from "components/ads/Tabs";
import ApplicationLoader from "pages/Applications/loader";
import TemplatesLoader from "pages/Templates/loader";
import PageWrapper from "pages/common/PageWrapper";
import { LeftPane as ApplicationsLeftPane } from "pages/Applications";
import styled from "styled-components";
import { Indices } from "constants/Layers";
import {
  APPLICATIONS_URL,
  TEMPLATES_URL,
  matchTemplatesPath,
} from "constants/routes";
import history from "utils/history";
import Filters from "pages/Templates/Filters";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

const StyledDiv = styled.div`
  width: 100%;
  height: 100%;
  display: block;
`;

export function Skeleton() {
  return <StyledDiv className={Classes.SKELETON} />;
}
const SentryRoute = Sentry.withSentryRouting(Route);

const TabsWrapper = styled.div`
  position: fixed;
  top: 2px;
  left: ${(props) => props.theme.homePage.sidebar}px;
  z-index: ${Indices.Layer9};
  margin-top: 8px;

  .react-tabs__tab-list {
    border-bottom: 1px solid #ededed;
    padding-left: 32px;
  }
  .tab-title-wrapper {
    padding-bottom: 17px;
  }
`;

const HomePageTabsKeys = {
  APPLICATIONS: "applications",
  TEMPLATES: "templates",
};

function LeftPane() {
  return (
    <Switch>
      <SentryRoute component={ApplicationsLeftPane} path={APPLICATIONS_URL} />
      <SentryRoute component={Filters} path={TEMPLATES_URL} />
    </Switch>
  );
}

const ContentRenderer = (
  <Switch>
    <SentryRoute component={ApplicationLoader} path={APPLICATIONS_URL} />
    <SentryRoute component={TemplatesLoader} path={TEMPLATES_URL} />
  </Switch>
);

const HomeTabs = [
  {
    key: HomePageTabsKeys.APPLICATIONS,
    title: "Applications",
    panelComponent: ContentRenderer,
    path: APPLICATIONS_URL,
  },
  {
    key: HomePageTabsKeys.TEMPLATES,
    title: "Templates",
    panelComponent: ContentRenderer,
    path: TEMPLATES_URL,
  },
];

function HomeScreenTabs() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { path } = useRouteMatch();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: ReduxActionTypes.GET_ALL_APPLICATION_INIT });
  }, []);

  const onSelect = (tabIndex: number) => {
    setSelectedIndex(selectedIndex);
    history.push(HomeTabs[tabIndex].path);
  };

  return (
    <PageWrapper>
      <LeftPane />
      <TabsWrapper>
        <TabComponent
          onSelect={onSelect}
          selectedIndex={matchTemplatesPath(path) ? 1 : 0}
          tabItemComponent={DefaultTabItem}
          tabs={HomeTabs}
        />
      </TabsWrapper>
    </PageWrapper>
  );
}

export default HomeScreenTabs;
