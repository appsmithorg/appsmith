import React from "react";
import { useHistory } from "react-router-dom";
import { WORKSPACE_INVITE_USERS_PAGE_URL } from "constants/routes";
import PageSectionHeader from "pages/common/PageSectionHeader";
import Button from "components/editorComponents/Button";

export function WorkspaceMembers() {
  const history = useHistory();

  return (
    <PageSectionHeader>
      <h2>Users</h2>
      <Button
        filled
        icon="plus"
        iconAlignment="left"
        intent="primary"
        onClick={() => history.push(WORKSPACE_INVITE_USERS_PAGE_URL)}
        text="Invite Users"
      />
    </PageSectionHeader>
  );
}

export default WorkspaceMembers;
