import React from "react";
import { Icon, Text } from "design-system";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Link } from "react-router-dom";
import styled from "styled-components";

const StyledLink = styled(Link)`
  text-decoration: underline;

  &:hover {
    color: var(--ads-v2-color-fg);
  }

  .ads-v2-icon {
    display: inline;
    margin-right: var(--ads-v2-spaces-2);

    svg {
      display: inline;
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
    <>
      <StyledLink
        data-testid="linked-resources-link"
        onClick={() =>
          AnalyticsUtil.logEvent("SCIM_PROVISIONED_USERS_CLICKED", {
            origin,
          })
        }
        to="/settings/users?provisioned=true"
      >
        <Icon name="user-3-line" size="md" />
        <Text>{`${
          provisionedUsers === 1
            ? `${provisionedUsers} user`
            : `${provisionedUsers} users`
        }`}</Text>
      </StyledLink>
      &nbsp;
      <Text>and</Text>&nbsp;
      <StyledLink
        data-testid="linked-resources-link"
        onClick={() =>
          AnalyticsUtil.logEvent("SCIM_PROVISIONED_GROUPS_CLICKED", { origin })
        }
        to="/settings/groups?provisioned=true"
      >
        <Icon name="group-line" size="md" />
        <Text>
          {`${
            provisionedGroups === 1
              ? `${provisionedGroups} group`
              : `${provisionedGroups} groups`
          }`}
        </Text>
      </StyledLink>
      &nbsp;
    </>
  );
};

export default ResourceLinks;
