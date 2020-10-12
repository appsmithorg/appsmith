import React, { useEffect } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import TagListField from "components/editorComponents/form/fields/TagListField";
import { reduxForm, SubmissionError } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import Divider from "components/editorComponents/Divider";
import Button from "components/editorComponents/Button";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getRolesForField,
  getAllUsers,
  getCurrentOrg,
} from "selectors/organizationSelectors";
import Spinner from "components/editorComponents/Spinner";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { InviteUsersToOrgFormValues, inviteUsersToOrg } from "./helpers";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";
import { Classes } from "@blueprintjs/core";
import FormMessage from "components/editorComponents/form/FormMessage";
import {
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USERS_VALIDATION_EMAILS_EMPTY,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
  INVITE_USERS_VALIDATION_ROLE_EMPTY,
} from "constants/messages";
import history from "utils/history";
import { Colors } from "constants/Colors";
import { isEmail } from "utils/formhelpers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { getAppsmithConfigs } from "configs";
import { ReactComponent as NoEmailConfigImage } from "assets/images/email-not-configured.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";

const OrgInviteTitle = styled.div`
  font-weight: bold;
  padding: 10px 0px;
`;

const DropDownOption = styled.div`
  padding: 10px 0;
`;

const OptionTitle = styled.div`
  font-weight: bold;
`;

const OptionDescription = styled.div`
  padding: 5px 0px;
  max-width: 250px;
`;

const StyledForm = styled.form`
  width: 100%;
  background: white;
  padding: ${props => props.theme.spaces[5]}px;
  &&& {
    .wrapper > div {
      width: 70%;
    }
    .bp3-input {
      box-shadow: none;
    }
    .bp3-button {
      padding-top: 5px;
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
    width: 85%;
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
    height: 31px;
    border-radius: 0px;
  }
`;

const Loading = styled(Spinner)`
  padding-top: 10px;
  margin: auto;
  width: 100%;
`;

const MailConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 5px;
  align-items: center;
  && > span {
    color: #2e3d49;
    font-weight: 500;
    font-size: 14px;
  }
  && > a {
    color: rgba(46, 61, 73, 0.5);
    font-size: 12px;
    text-decoration: underline;
  }
`;

const validateFormValues = (values: { users: string; role: string }) => {
  if (values.users && values.users.length > 0) {
    const _users = values.users.split(",").filter(Boolean);

    _users.forEach(user => {
      if (!isEmail(user)) {
        throw new SubmissionError({
          _error: INVITE_USERS_VALIDATION_EMAIL_LIST,
        });
      }
    });
  } else {
    throw new SubmissionError({ _error: INVITE_USERS_VALIDATION_EMAILS_EMPTY });
  }

  if (values.role === undefined || values.role?.trim().length === 0) {
    throw new SubmissionError({ _error: INVITE_USERS_VALIDATION_ROLE_EMPTY });
  }
};

const validate = (values: any) => {
  const errors: any = {};
  if (!(values.users && values.users.length > 0)) {
    errors["users"] = INVITE_USERS_VALIDATION_EMAILS_EMPTY;
  }

  if (values.role === undefined || values.role?.trim().length === 0) {
    errors["role"] = INVITE_USERS_VALIDATION_ROLE_EMPTY;
  }

  return errors;
};

const { mailEnabled } = getAppsmithConfigs();

const OrgInviteUsersForm = (props: any) => {
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
    valid,
    fetchCurrentOrg,
    currentOrg,
    isApplicationInvite,
    isLoading,
  } = props;

  const currentPath = useLocation().pathname;
  const pathRegex = /(?:\/org\/)\w+(?:\/settings)/;

  const userOrgPermissions = currentOrg?.userPermissions ?? [];
  const canManage = isPermitted(
    userOrgPermissions,
    PERMISSION_TYPE.MANAGE_ORGANIZATION,
  );

  useEffect(() => {
    fetchUser(props.orgId);
    fetchAllRoles(props.orgId);
    fetchCurrentOrg(props.orgId);
  }, [props.orgId, fetchUser, fetchAllRoles, fetchCurrentOrg]);

  const styledRoles = props.roles.map((role: any) => {
    return {
      id: role.id,
      name: role.name,
      content: (
        <DropDownOption>
          <OptionTitle>{role.name}</OptionTitle>
          <OptionDescription>{role.description}</OptionDescription>
        </DropDownOption>
      ),
    };
  });

  return (
    <>
      {isApplicationInvite && (
        <>
          <Divider />
          <OrgInviteTitle>Invite Users to {currentOrg?.name} </OrgInviteTitle>
        </>
      )}
      <StyledForm
        onSubmit={handleSubmit((values: any, dispatch: any) => {
          validateFormValues(values);
          AnalyticsUtil.logEvent("INVITE_USER", values);
          return inviteUsersToOrg({ ...values, orgId: props.orgId }, dispatch);
        })}
      >
        {submitSucceeded && (
          <FormMessage intent="primary" message={INVITE_USERS_SUBMIT_SUCCESS} />
        )}
        {submitFailed && error && (
          <FormMessage intent="danger" message={error} />
        )}
        <StyledInviteFieldGroup>
          <div className="wrapper">
            <TagListField
              name="users"
              placeholder="Enter email address"
              type="email"
              label="Emails"
              intent="success"
              data-cy="t--invite-email-input"
            />
            <SelectField
              name="role"
              placeholder="Select a role"
              options={styledRoles}
              size="small"
              outline={false}
              data-cy="t--invite-role-input"
            />
          </div>
          <StyledButton
            className="t--invite-user-btn"
            disabled={!valid}
            text="Invite"
            filled
            intent="primary"
            loading={submitting && !(submitFailed && !anyTouched)}
            type="submit"
          />
        </StyledInviteFieldGroup>
        {isLoading ? (
          <Loading size={30} />
        ) : (
          <React.Fragment>
            {!mailEnabled && (
              <MailConfigContainer>
                {allUsers.length === 0 && <NoEmailConfigImage />}
                <span>You haven’t setup any email service yet</span>
                <a
                  href="https://docs.appsmith.com/third-party-services/email"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Please configure your email service to invite people
                </a>
              </MailConfigContainer>
            )}
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
          </React.Fragment>
        )}
        {!pathRegex.test(currentPath) && canManage && (
          <Button
            className="manageUsers"
            text="Manage Users"
            filled
            intent="primary"
            onClick={() => {
              history.push(`/org/${props.orgId}/settings/members`);
            }}
          />
        )}
      </StyledForm>
    </>
  );
};

export default connect(
  (state: AppState) => {
    return {
      roles: getRolesForField(state),
      allUsers: getAllUsers(state),
      currentOrg: getCurrentOrg(state),
      isLoading: state.ui.orgs.loadingStates.isFetchAllUsers,
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
    fetchCurrentOrg: (orgId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_CURRENT_ORG,
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
    {
      fetchAllRoles: (orgId: string) => void;
      roles?: any;
      applicationId?: string;
      orgId?: string;
      isApplicationInvite?: boolean;
    }
  >({
    validate,
    form: INVITE_USERS_TO_ORG_FORM,
  })(OrgInviteUsersForm),
);
