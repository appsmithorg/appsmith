import React, { useEffect } from "react";
import styled from "styled-components";
import TagListField from "components/editorComponents/form/fields/TagListField";
import { reduxForm } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import Button from "components/editorComponents/Button";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getDefaultRole,
  getRolesForField,
  getAllUsers,
} from "selectors/organizationSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { InviteUsersToOrgFormValues, inviteUsersToOrg } from "./helpers";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";
import { Classes } from "@blueprintjs/core";
import FormMessage from "components/editorComponents/form/FormMessage";
import {
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USERS_SUBMIT_ERROR,
} from "constants/messages";
import history from "utils/history";
import { Colors } from "constants/Colors";
const StyledForm = styled.div`
  width: 100%;
  background: white;
  padding: ${props => props.theme.spaces[5]}px;
  &&& {
    .bp3-input {
      width: calc(100vh - 285px);
      box-shadow: none;
    }
  }
  .manageUsers {
    float: right;
    margin-top: 20px;
  }
`;
const StyledInviteFieldGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .wrapper {
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    padding-right: 5px;
    border-width: 1px;
    border-right: 0px;
    border-style: solid;
    border-color: ${Colors.ATHENS_GRAY};
  }
`;

const UserList = styled.div`
  max-height: 200px;
  margin-top: 20px;
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
    height: 41px;
    border-radius: 0px;
  }
`;

const InviteUsersForm = (props: any) => {
  const {
    handleSubmit,
    allUsers,
    submitting,
    anyTouched,
    submitFailed,
    submitSucceeded,
    error,
    fetchUser,
    fetchAllRoles,
  } = props;
  useEffect(() => {
    fetchUser(props.orgId);
    fetchAllRoles(props.orgId);
  }, [props.orgId, fetchUser, fetchAllRoles]);

  return (
    <StyledForm>
      {submitSucceeded && (
        <FormMessage intent="primary" message={INVITE_USERS_SUBMIT_SUCCESS} />
      )}
      {submitFailed && error && (
        <FormMessage
          intent="danger"
          message={`${INVITE_USERS_SUBMIT_ERROR}: ${error}`}
        />
      )}
      <StyledInviteFieldGroup>
        <div className="wrapper">
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
            outline={false}
          />
        </div>
        <StyledButton
          className="invite"
          text="Invite"
          filled
          intent="primary"
          loading={submitting && !(submitFailed && !anyTouched)}
          onClick={handleSubmit((values: any, dispatch: any) =>
            inviteUsersToOrg({ ...values, orgId: props.orgId }, dispatch),
          )}
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
        onClick={() => {
          history.push(`/org/${props.orgId}/settings`);
        }}
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
