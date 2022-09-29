import React, { useState } from "react";
import PageWrapper from "pages/common/PageWrapper";
import styled from "styled-components";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { Text, TextType } from "design-system";
import { Icon } from "@blueprintjs/core";
import General from "./General";
import { Colors } from "constants/Colors";
import GitConfig from "./GitConfig";
import { useLocation } from "react-router";
import { GIT_PROFILE_ROUTE } from "constants/routes";
import { useSelector } from "react-redux";
import { selectFeatureFlags } from "selectors/usersSelectors";

const ProfileWrapper = styled.div`
  width: ${(props) => props.theme.pageContentWidth}px;
  margin: 0 auto;
`;

const LinkToApplications = styled.div`
  margin-top: 30px;
  margin-bottom: 35px;
  display: inline-block;
  width: auto;

  &:hover {
    text-decoration: none;
  }

  svg {
    cursor: pointer;
  }
`;

function UserProfile() {
  const location = useLocation();
  const featureFlags = useSelector(selectFeatureFlags);

  let initialTabIndex = 0;
  const tabs: TabProp[] = [
    {
      key: "general",
      title: "General",
      panelComponent: <General />,
      icon: "general",
    },
  ];

  if (featureFlags.GIT) {
    tabs.push({
      key: "gitConfig",
      title: "Git user config",
      panelComponent: <GitConfig />,
      icon: "git-branch",
    });
    if (location.pathname === GIT_PROFILE_ROUTE) {
      initialTabIndex = 1;
    }
  }

  const [selectedTabIndex, setSelectedTabIndex] = useState(initialTabIndex);

  return (
    <PageWrapper displayName={"Profile"}>
      <ProfileWrapper>
        <LinkToApplications className="t--back" onClick={() => history.back()}>
          <Icon color={Colors.SILVER_CHALICE} icon="chevron-left" />
          <Text type={TextType.H1}>Profile</Text>
        </LinkToApplications>
        <TabComponent
          onSelect={setSelectedTabIndex}
          selectedIndex={selectedTabIndex}
          tabs={tabs}
        />
      </ProfileWrapper>
    </PageWrapper>
  );
}

export default UserProfile;
