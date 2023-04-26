import React from "react";
import { useLocation } from "react-router-dom";
import { Link } from "design-system";

function ManageUsers({
  workspaceId,
}: {
  isApplicationInvite?: boolean;
  workspaceId: string;
}) {
  const currentPath = useLocation().pathname;
  const pathRegex = /(?:\/workspace\/)\w+(?:\/settings)/;

  return !pathRegex.test(currentPath) ? (
    <Link
      endIcon="arrow-right-s-line"
      kind="secondary"
      to={`/workspace/${workspaceId}/settings/members`}
    >
      Manage Users
    </Link>
  ) : null;
}
export default ManageUsers;
