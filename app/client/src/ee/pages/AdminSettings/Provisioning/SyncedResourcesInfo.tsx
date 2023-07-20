import React from "react";
import styled from "styled-components";
import { Link, Text } from "design-system";
import type { ScimProps } from "./types";

const Container = styled.span`
  display: flex;
`;

const SyncedResourcesInfo = (props: ScimProps) => {
  const { provisioningDetails } = props;
  return (
    <Container data-testid="synced-resources-info">
      <Link
        startIcon="user-3-line"
        target="_self"
        to="/settings/users?provisioned=true"
      >
        {`${provisioningDetails.provisionedUsers} users`}
      </Link>
      &nbsp;
      <Text>and</Text>&nbsp;
      <Link
        startIcon="group-line"
        target="_self"
        to="/settings/groups?provisioned=true"
      >
        {`${provisioningDetails.provisionedGroups} groups`}
      </Link>
      &nbsp;
      <Text>are linked to your IDP</Text>
    </Container>
  );
};

export default SyncedResourcesInfo;
