import React, { useEffect } from "react";
import styled from "styled-components";
import TagListField from "components/editorComponents/form/fields/TagListField";
import FormGroup from "components/editorComponents/form/FormGroup";
import { reduxForm } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import Button from "components/editorComponents/Button";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getRoles,
  getDefaultRole,
  getRolesForField,
  getAllUsers,
} from "selectors/organizationSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { InviteUsersToOrgFormValues, inviteUsersToOrg } from "./helpers";
import { OrgRole } from "constants/orgConstants";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";
import { Classes } from "@blueprintjs/core";
import { noop } from "lodash";
const StyledForm = styled.div`
  width: 100%;
  background: white;
  padding: ${props => props.theme.spaces[5]}px;
  &&& {
    .bp3-input {
      width: 250px;
    }
  }
  .manageUsers {
    float: right;
    margin-top: 12px;
  }
`;
const StyledInviteFieldGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  .users {
    width: 300px;
  }

  .wrapper {
    display: flex;
    width: 100%;
    flex-direction: row;
    alignItem: "center",
    justifyContent: "center",
  }
`;

const UserList = styled.div`
  max-height: 100px;
  overflow-y: scroll;
  .user {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 8px;
    margin-bottom: 8px;
  }
`;

const StyledButton = styled(Button)`
  &&&.${Classes.BUTTON} {
    width: 83px;
    height: 40px;
  }
`;

const InviteUsersForm = (props: any) => {
  const { handleSubmit, allUsers } = props;
  useEffect(() => {
    props.fetchUser(props.orgId);
    props.fetchAllRoles(props.orgId);
  }, [props.orgId]);

  return (
    <StyledForm>
      <StyledInviteFieldGroup>
        <TagListField
          name="users"
          placeholder="Enter email address"
          type="email"
          label="Emails"
          intent="success"
        />
        <SelectField
          name="role"
          placeholder="Select a role"
          options={props.roles}
          size="large"
        />
        <StyledButton
          className="invite"
          text="Invite"
          filled
          intent="primary"
          onClick={handleSubmit((values: any, dispatch: any) => {
            inviteUsersToOrg({ ...values, orgId: props.orgId }, dispatch);
          })}
        />
      </StyledInviteFieldGroup>
      <UserList style={{ justifyContent: "space-between" }}>
        {allUsers.map((user: { username: string; roleName: string }) => {
          return (
            <div className="user" key={user.username}>
              <div>{user.username}</div>
              <div>{user.roleName}</div>
            </div>
          );
        })}
      </UserList>
      <Button
        className="manageUsers"
        text="Manage Users"
        filled
        intent="primary"
        onClick={noop}
      />
    </StyledForm>
  );
};

export default connect(
  (state: AppState) => {
    return {
      roles: getRolesForField(state),
      defaultRole: getDefaultRole(state),
      allUsers: getAllUsers(state),
    };
  },
  (dispatch: any) => ({
    fetchAllRoles: (orgId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_ROLES_INIT,
        payload: {
          orgId,
        },
      }),
    fetchUser: (orgId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
        payload: {
          orgId,
        },
      }),
  }),
)(
  reduxForm<
    InviteUsersToOrgFormValues,
    { fetchAllRoles: (orgId: string) => void; roles?: any }
  >({
    form: INVITE_USERS_TO_ORG_FORM,
  })(InviteUsersForm),
);
