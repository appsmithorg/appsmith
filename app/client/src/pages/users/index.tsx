import React from "react";
import { useHistory } from "react-router-dom";
import { ORG_INVITE_USERS_PAGE_URL } from "constants/routes";
import PageSectionHeader from "pages/common/PageSectionHeader";
import Button from "components/editorComponents/Button";
import PageWrapper from "pages/common/PageWrapper";

export const OrgMembers = () => {
  const history = useHistory();

  return (
    <PageWrapper displayName="Users">
      <PageSectionHeader>
        <h2>Users</h2>
        <Button
          intent="primary"
          text="Invite Users"
          icon="plus"
          iconAlignment="left"
          filled
          onClick={() => history.push(ORG_INVITE_USERS_PAGE_URL)}
        />
      </PageSectionHeader>
    </PageWrapper>
  );
};

export default OrgMembers;
