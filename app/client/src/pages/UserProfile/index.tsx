import React, { useState } from "react";
import PageWrapper from "@appsmith/pages/common/PageWrapper";
import styled from "styled-components";
import { Button, Tabs, Tab, TabsList, Icon, TabPanel } from "design-system";
import General from "./General";
import GitConfig from "./GitConfig";
import { useLocation } from "react-router";
import { GIT_PROFILE_ROUTE } from "constants/routes";
import { createMessage, GO_BACK } from "@appsmith/constants/messages";

const ProfileWrapper = styled.div`
  width: ${(props) => props.theme.pageContentWidth}px;
  margin: 0 auto;

  .tab-item {
    display: flex;
    gap: 5px;
    align-items: center;
  }
`;

const LinkToApplications = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
`;

function UserProfile() {
  const location = useLocation();

  let initialTab = "general";
  const tabs = [
    {
      key: "general",
      title: "General",
      panelComponent: <General />,
      icon: "general",
    },
  ];

  tabs.push({
    key: "gitConfig",
    title: "Git user config",
    panelComponent: <GitConfig />,
    icon: "git-branch",
  });
  if (location.pathname === GIT_PROFILE_ROUTE) {
    initialTab = "gitConfig";
  }

  const [selectedTab, setSelectedTab] = useState(initialTab);

  return (
    <PageWrapper displayName={"Profile"}>
      <ProfileWrapper>
        <LinkToApplications className="t--back" onClick={() => history.back()}>
          <Button
            kind="tertiary"
            renderAs="button"
            size="sm"
            startIcon="arrow-left-line"
          >
            {createMessage(GO_BACK)}
          </Button>
        </LinkToApplications>
        <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            {tabs.map((tab) => {
              return (
                <Tab key={tab.key} value={tab.key}>
                  <div className="tab-item">
                    <Icon name={tab.icon} />
                    {tab.title}
                  </div>
                </Tab>
              );
            })}
          </TabsList>
          {tabs.map((tab) => {
            return (
              <TabPanel key={tab.key} value={tab.key}>
                {tab.panelComponent}
              </TabPanel>
            );
          })}
        </Tabs>
      </ProfileWrapper>
    </PageWrapper>
  );
}

export default UserProfile;
