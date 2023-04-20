import React from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { Link } from "design-system";

const Container = styled.div`
  display: flex;
  padding: 12px 0;
  border-top: 1px solid var(--ads-v2-color-border);
`;

function ManageUsers({
  workspaceId,
}: {
  isApplicationInvite?: boolean;
  workspaceId: string;
}) {
  const currentPath = useLocation().pathname;
  const pathRegex = /(?:\/workspace\/)\w+(?:\/settings)/;

  return !pathRegex.test(currentPath) ? (
    <Container>
      <Link
        endIcon="arrow-right-line"
        kind="secondary"
        to={`/workspace/${workspaceId}/settings/members`}
      >
        Manage Users
      </Link>
    </Container>
  ) : null;
}
export default ManageUsers;
