import React from "react";
import { Link, Text } from "design-system";
import AnalyticsUtil from "utils/AnalyticsUtil";
import styled from "styled-components";

const Wrapper = styled.span`
  a {
    display: inline;
    span {
      display: inline;
      svg {
        display: inline;
      }
    }
  }
`;

const ResourceLinks = ({
  origin,
  provisionedGroups,
  provisionedUsers,
}: {
  origin: string;
  provisionedGroups: number;
  provisionedUsers: number;
}) => {
  return (
    <Wrapper>
      <Link
        data-testid="linked-resources-link"
        onClick={() =>
          AnalyticsUtil.logEvent("SCIM_PROVISIONED_USERS_CLICKED", {
            origin,
          })
        }
        startIcon="user-3-line"
        target="_self"
        to="/settings/users?provisioned=true"
      >
        {provisionedUsers === 1
          ? `${provisionedUsers} user`
          : `${provisionedUsers} users`}
      </Link>
      &nbsp;
      <Text>and</Text>&nbsp;
      <Link
        data-testid="linked-resources-link"
        onClick={() =>
          AnalyticsUtil.logEvent("SCIM_PROVISIONED_GROUPS_CLICKED", { origin })
        }
        startIcon="group-line"
        target="_self"
        to="/settings/groups?provisioned=true"
      >
        {provisionedGroups === 1
          ? `${provisionedGroups} group`
          : `${provisionedGroups} groups`}
      </Link>
      &nbsp;
    </Wrapper>
  );
};

export default ResourceLinks;
