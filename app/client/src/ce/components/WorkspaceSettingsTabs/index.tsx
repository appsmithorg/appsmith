import React, { useCallback, useEffect, useMemo } from "react";
import { useRouteMatch, useLocation, useHistory } from "react-router-dom";
import MemberSettings from "ee/pages/workspace/Members";
import { GeneralSettings } from "pages/workspace/General";
import { Tabs, Tab, TabsList, TabPanel } from "@appsmith/ads";
import { navigateToTab } from "ee/pages/workspace/helpers";
import styled from "styled-components";

import { APPLICATIONS_URL } from "constants/routes/baseRoutes";
import { SentryRoute } from "components/SentryRoute";

export const TabsWrapper = styled.div`
  padding-top: var(--ads-v2-spaces-4);

  .ads-v2-tabs {
    height: 100%;
    overflow: hidden;

    .tab-panel {
      height: calc(100% - 46px);
    }
  }
`;

interface TabProp {
  key: string;
  title: string;
  count?: number;
  panelComponent?: JSX.Element;
}

export interface WorkspaceSettingsTabsProps {
  currentTab: string | undefined;
  isMemberofTheWorkspace: boolean;
  hasManageWorkspacePermissions: boolean;
  searchValue: string;
  setTabArrLen: (tabArrLen: number) => void;
  workspacePermissions?: string[];
  // EE Tab Props
  addTabComponent?: () => TabProp;
  eeTabRedirect?: boolean;
}

enum TABS {
  GENERAL = "general",
  MEMBERS = "members",
}

export const WorkspaceSettingsTabs = ({
  addTabComponent,
  currentTab,
  eeTabRedirect,
  hasManageWorkspacePermissions,
  isMemberofTheWorkspace,
  searchValue,
  setTabArrLen,
  workspacePermissions,
}: WorkspaceSettingsTabsProps) => {
  const { path } = useRouteMatch();
  const location = useLocation();
  const history = useHistory();

  const shouldRedirect = useMemo(() => {
    // If the permissions are not yet fetched, don't redirect
    if (!workspacePermissions) {
      return false;
    }

    // If user doesn't have manage workspace permissions & is on settings page, redirect to applications
    if (currentTab === TABS.GENERAL && !hasManageWorkspacePermissions)
      return true;

    // If user doesn't have manage members permissions & is on members page, redirect to applications
    if (currentTab === TABS.MEMBERS && !isMemberofTheWorkspace) return true;

    // If the redirect flag is set to true by EE application, redirect to applications
    if (eeTabRedirect) return true;

    return false;
  }, [
    workspacePermissions,
    isMemberofTheWorkspace,
    hasManageWorkspacePermissions,
    currentTab,
    eeTabRedirect,
  ]);

  useEffect(() => {
    if (shouldRedirect) {
      history.replace(APPLICATIONS_URL);
    }
  }, [shouldRedirect]);

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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    hasManageWorkspacePermissions && {
      key: "general",
      title: "General Settings",
      panelComponent: GeneralSettingsComponent,
    },
    isMemberofTheWorkspace && {
      key: "members",
      title: "Members",
      panelComponent: MemberSettingsComponent,
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
