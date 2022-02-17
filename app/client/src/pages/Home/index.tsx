import React, { useEffect, useState } from "react";
import { useRouteMatch, Route, Switch } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { Classes } from "@blueprintjs/core";
import {
  TabComponent,
  DefaultTabItem,
  TabItemProps,
} from "components/ads/Tabs";
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
  TEMPLATES_ID_PATH,
} from "constants/routes";
import history from "utils/history";
import Filters from "pages/Templates/Filters";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import LeftPaneTemplateList from "pages/Templates/LeftPaneTemplateList";
import {
  getTemplateNotificationSeenAction,
  setTemplateNotificationSeenAction,
} from "actions/templateActions";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import { showTemplateNotificationSelector } from "selectors/templatesSelectors";
import { Popover2 } from "@blueprintjs/popover2";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { isNull } from "lodash";

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
      <SentryRoute component={Filters} exact path={TEMPLATES_URL} />
      <SentryRoute component={LeftPaneTemplateList} path={TEMPLATES_ID_PATH} />
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

const NotificationWrapper = styled.div`
  background-color: #f1f1f1;
  padding: 8px 18px;
  display: flex;
  flex-direction: row;

  .text-wrapper {
    display: flex;
    flex-direction: column;
    margin-left: 18px;
  }

  .description {
    margin-top: 2px;
  }
`;

export function TemplateFeatureNotification() {
  return (
    <NotificationWrapper>
      <Icon name={"info"} size={IconSize.XXL} />
      <div className={"text-wrapper"}>
        <Text type={TextType.H4}>Introducing Templates</Text>
        <Text className="description" type={TextType.P1}>
          You can browse, fork, and make them your own here
        </Text>
      </div>
    </NotificationWrapper>
  );
}

export function TemplatesTabItem(props: TabItemProps) {
  const showTemplateNotification = useSelector(
    showTemplateNotificationSelector,
  );
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const hideNotification =
    isFetchingApplications || isNull(showTemplateNotification);

  return (
    <Popover2
      content={<TemplateFeatureNotification />}
      isOpen={hideNotification ? false : !showTemplateNotification}
      minimal
      placement="bottom-start"
    >
      <DefaultTabItem {...props} />
    </Popover2>
  );
}

function TabItem(props: TabItemProps) {
  if (props.tab.key === HomePageTabsKeys.TEMPLATES) {
    return <TemplatesTabItem {...props} />;
  }

  return <DefaultTabItem {...props} />;
}

function HomeScreenTabs() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { path } = useRouteMatch();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: ReduxActionTypes.GET_ALL_APPLICATION_INIT });
    dispatch(getTemplateNotificationSeenAction());
  }, []);

  const onSelect = (tabIndex: number) => {
    setSelectedIndex(selectedIndex);
    history.push(HomeTabs[tabIndex].path);

    if (HomeTabs[tabIndex].key === HomePageTabsKeys.TEMPLATES) {
      dispatch(setTemplateNotificationSeenAction(true));
    }
  };

  return (
    <PageWrapper>
      <LeftPane />
      <TabsWrapper>
        <TabComponent
          onSelect={onSelect}
          selectedIndex={matchTemplatesPath(path) ? 1 : 0}
          tabItemComponent={TabItem}
          tabs={HomeTabs}
        />
      </TabsWrapper>
    </PageWrapper>
  );
}

export default HomeScreenTabs;
