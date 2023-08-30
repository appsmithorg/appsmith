import React, { useCallback, useEffect } from "react";
import {
  useRouteMatch,
  Route,
  useLocation,
  useHistory,
} from "react-router-dom";
import MemberSettings from "@appsmith/pages/workspace/Members";
import { GeneralSettings } from "pages/workspace/General";
import { Tabs, Tab, TabsList, TabPanel } from "design-system";
import { navigateToTab } from "@appsmith/pages/workspace/helpers";
import styled from "styled-components";

import * as Sentry from "@sentry/react";
export const SentryRoute = Sentry.withSentryRouting(Route);

export const TabsWrapper = styled.div`
  padding-top: var(--ads-v2-spaces-4);

  .ads-v2-tabs {
    height: 100%;
    overflow: hidden;

    .tab-panel {
      overflow: auto;
      height: calc(100% - 46px);
    }
  }
`;

type TabProp = {
  key: string;
  title: string;
  count?: number;
  panelComponent?: JSX.Element;
};

export type WorkspaceSettingsTabsProps = {
  currentTab: string | undefined;
  isMemberofTheWorkspace: boolean;
  searchValue: string;
  setTabArrLen: (tabArrLen: number) => void;
  addTabComponent?: () => TabProp;
};

export const WorkspaceSettingsTabs = ({
  addTabComponent,
  currentTab,
  isMemberofTheWorkspace,
  searchValue,
  setTabArrLen,
}: WorkspaceSettingsTabsProps) => {
  const { path } = useRouteMatch();
  const location = useLocation();
  const history = useHistory();

  const GeneralSettingsComponent = (
    <SentryRoute
      component={GeneralSettings}
      location={location}
      path={`${path}/general`}
    />
  );

  const MemberSettingsComponent = (
    <SentryRoute
      component={useCallback(
        (props: any) => (
          <MemberSettings {...props} searchValue={searchValue} />
        ),
        [location, searchValue],
      )}
      location={location}
      path={`${path}/members`}
    />
  );

  const tabArr: TabProp[] = [
    isMemberofTheWorkspace && {
      key: "members",
      title: "Members",
      panelComponent: MemberSettingsComponent,
    },
    {
      key: "general",
      title: "General Settings",
      panelComponent: GeneralSettingsComponent,
    },
    addTabComponent && addTabComponent(),
  ].filter(Boolean) as TabProp[];

  useEffect(() => {
    setTabArrLen(tabArr.length);
  }, [tabArr.length, setTabArrLen]);

  return (
    <TabsWrapper
      className="tabs-wrapper"
      data-testid="t--user-edit-tabs-wrapper"
    >
      <Tabs
        defaultValue={currentTab}
        onValueChange={(key: string) => navigateToTab(key, location, history)}
        value={currentTab}
      >
        <TabsList>
          {tabArr.map((tab) => {
            return (
              <Tab
                data-testid={`t--tab-${tab.key}`}
                key={tab.key}
                value={tab.key}
              >
                <div className="tab-item">{tab.title}</div>
              </Tab>
            );
          })}
        </TabsList>
        {tabArr.map((tab) => {
          return (
            <TabPanel className="tab-panel" key={tab.key} value={tab.key}>
              {tab.panelComponent}
            </TabPanel>
          );
        })}
      </Tabs>
    </TabsWrapper>
  );
};
