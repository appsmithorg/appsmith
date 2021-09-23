import React from "react";
import PageWrapper from "pages/common/PageWrapper";
import styled from "styled-components";
import { TabComponent, TabProp } from "components/ads/Tabs";
import Text, { TextType } from "components/ads/Text";
import { Icon } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import General from "./General";
import { Colors } from "constants/Colors";
import getFeatureFlags from "utils/featureFlags";
import GitConfig from "./GitConfig";

const ProfileWrapper = styled.div`
  width: ${(props) => props.theme.pageContentWidth}px;
  margin: 0 auto;
`;

const LinkToApplications = styled(Link)`
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
  const tabs: TabProp[] = [
    {
      key: "general",
      title: "General",
      panelComponent: <General />,
      icon: "general",
    },
  ];

  if (getFeatureFlags().GIT) {
    tabs.push({
      key: "gitConfig",
      title: "Git user config",
      panelComponent: <GitConfig />,
      icon: "git-branch",
    });
  }

  return (
    <PageWrapper displayName={"Profile"}>
      <ProfileWrapper>
        <LinkToApplications className="t--back" to={"/applications"}>
          <Icon color={Colors.SILVER_CHALICE} icon="chevron-left" />
          <Text type={TextType.H1}>Profile</Text>
        </LinkToApplications>
        <TabComponent tabs={tabs} />
      </ProfileWrapper>
    </PageWrapper>
  );
}

export default UserProfile;
