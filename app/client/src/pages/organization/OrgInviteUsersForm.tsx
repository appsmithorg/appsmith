import React, { Fragment, useContext, useEffect, useState } from "react";
import styled, { css, ThemeContext } from "styled-components";
import TagListField from "components/editorComponents/form/fields/TagListField";
import { reduxForm, SubmissionError } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import { connect, useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getRolesForField,
  getAllUsers,
  getCurrentAppOrg,
} from "selectors/organizationSelectors";
import Spinner from "components/editorComponents/Spinner";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { InviteUsersToOrgFormValues, inviteUsersToOrg } from "./helpers";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";
import {
  createMessage,
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USER_SUBMIT_SUCCESS,
  INVITE_USERS_VALIDATION_EMAILS_EMPTY,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
  INVITE_USERS_VALIDATION_ROLE_EMPTY,
} from "@appsmith/constants/messages";
import { isEmail } from "utils/formhelpers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ReactComponent as NoEmailConfigImage } from "assets/images/email-not-configured.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Button, { Size } from "components/ads/Button";
import Text, { TextType } from "components/ads/Text";
import { Classes, Variant } from "components/ads/common";
import Callout from "components/ads/Callout";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import ProfileImage from "pages/common/ProfileImage";
import ManageUsers from "./ManageUsers";
import ScrollIndicator from "components/ads/ScrollIndicator";
import UserApi from "api/UserApi";
import { Colors } from "constants/Colors";

const CommonTitleTextStyle = css`
  color: ${Colors.CHARCOAL};
  font-weight: normal;
`;

const OrgInviteWrapper = styled.div``;

const OrgInviteTitle = styled.div`
  padding: 0 0 10px 0;
  & > span[type="h5"] {
    ${CommonTitleTextStyle}
  }
`;

const StyledForm = styled.form`
  width: 100%;
  background: ${(props) => props.theme.colors.modal.bg};
  &&& {
    .wrapper > div:nth-child(1) {
      width: 60%;
    }
    .wrapper > div:nth-child(2) {
      width: 40%;
    }
    .bp3-input {
      box-shadow: none;
    }
    .bp3-button {
      padding-top: 5px;
    }
  }
`;

const ErrorBox = styled.div<{ message?: boolean }>`
  ${(props) =>
    props.message ? `margin: ${props.theme.spaces[9]}px 0px` : null};
`;

const StyledInviteFieldGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .wrapper {
    display: flex;
    width: 85%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-right: ${(props) => props.theme.spaces[3]}px;
    border-right: 0px;
  }
`;

const UserList = styled.div`
  margin-top: 24px;
  max-height: 260px;
  overflow-y: auto;
  &&::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.modal.scrollbar};
  }
`;

const User = styled.div`
  display: flex;
  align-items: center;
  height: 54px;
  padding-left: 15px;
  justify-content: space-between;
  color: ${(props) => props.theme.colors.modal.user.textColor};
`;

const UserInfo = styled.div`
  display: inline-flex;
  align-items: center;
  div:first-child {
    cursor: default;
  }
`;

const UserRole = styled.div`
  flex-basis: 25%;
  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.modal.headerText};
  }
`;

const UserName = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 10px;
  span:nth-child(1) {
    margin-bottom: 1px;
  }
`;

const RoleDivider = styled.div`
  border-top: 1px solid ${(props) => props.theme.colors.menuBorder};
`;

const Loading = styled(Spinner)`
  padding-top: 10px;
  margin: auto;
  width: 100%;
`;

const MailConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spaces[9]}px
    ${(props) => props.theme.spaces[2]}px;
  align-items: center;
  && > span {
    color: ${(props) => props.theme.colors.modal.email.message};
    font-weight: 500;
    font-size: 14px;
  }
  && > a {
    color: ${(props) => props.theme.colors.modal.email.desc};
    font-size: 12px;
    text-decoration: underline;
  }
`;

const validateFormValues = (values: { users: string; role: string }) => {
  if (values.users && values.users.length > 0) {
    const _users = values.users.split(",").filter(Boolean);

    _users.forEach((user) => {
      if (!isEmail(user)) {
        throw new SubmissionError({
          _error: createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST),
        });
      }
    });
  } else {
    throw new SubmissionError({
      _error: createMessage(INVITE_USERS_VALIDATION_EMAILS_EMPTY),
    });
  }

  if (values.role === undefined || values.role?.trim().length === 0) {
    throw new SubmissionError({
      _error: createMessage(INVITE_USERS_VALIDATION_ROLE_EMPTY),
    });
  }
};

const validate = (values: any) => {
  const errors: any = {};
  if (!(values.users && values.users.length > 0)) {
    errors["users"] = createMessage(INVITE_USERS_VALIDATION_EMAILS_EMPTY);
  }

  if (values.role === undefined || values.role?.trim().length === 0) {
    errors["role"] = createMessage(INVITE_USERS_VALIDATION_ROLE_EMPTY);
  }

  if (values.users && values.users.length > 0) {
    const _users = values.users.split(",").filter(Boolean);

    _users.forEach((user: string) => {
      if (!isEmail(user)) {
        errors["users"] = createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST);
      }
    });
  }
  return errors;
};

const { mailEnabled } = getAppsmithConfigs();

export const InviteButtonWidth = "88px";

function OrgInviteUsersForm(props: any) {
  const [emailError, setEmailError] = useState("");
  const userRef = React.createRef<HTMLDivElement>();
  const {
    allUsers,
    anyTouched,
    error,
    fetchAllRoles,
    fetchCurrentOrg,
    fetchUser,
    handleSubmit,
    isApplicationInvite,
    isLoading,
    submitFailed,
    submitSucceeded,
    submitting,
    valid,
  } = props;

  // set state for checking number of users invited
  const [numberOfUsersInvited, updateNumberOfUsersInvited] = useState(0);
  const currentOrg = useSelector(getCurrentAppOrg);

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
      value: role.name,
      label: role.description,
    };
  });

  const theme = useContext(ThemeContext);

  const allUsersProfiles = React.useMemo(
    () =>
      allUsers.map(
        (user: { username: string; roleName: string; name: string }) => {
          const details = getInitialsAndColorCode(
            user.name || user.username,
            theme.colors.appCardColors,
          );
          return {
            ...user,
            initials: details[0],
          };
        },
      ),
    [allUsers, theme],
  );

  return (
    <OrgInviteWrapper>
      {isApplicationInvite && (
        <OrgInviteTitle>
          <Text type={TextType.H5}>Invite users to {currentOrg?.name} </Text>
        </OrgInviteTitle>
      )}
      <StyledForm
        onSubmit={handleSubmit((values: any, dispatch: any) => {
          validateFormValues(values);
          AnalyticsUtil.logEvent("INVITE_USER", values);
          const usersAsStringsArray = values.users.split(",");
          // update state to show success message correctly
          updateNumberOfUsersInvited(usersAsStringsArray.length);
          return inviteUsersToOrg({ ...values, orgId: props.orgId }, dispatch);
        })}
      >
        <StyledInviteFieldGroup>
          <div className="wrapper">
            <TagListField
              customError={(err: string) => setEmailError(err)}
              data-cy="t--invite-email-input"
              intent="success"
              label="Emails"
              name="users"
              placeholder="Enter email address"
              type="email"
            />
            <SelectField
              data-cy="t--invite-role-input"
              name="role"
              options={styledRoles}
              outline={false}
              placeholder="Select a role"
              size="small"
            />
          </div>
          <Button
            className="t--invite-user-btn"
            disabled={!valid}
            isLoading={submitting && !(submitFailed && !anyTouched)}
            size={Size.large}
            tag="button"
            text="Invite"
            variant={Variant.info}
            width={InviteButtonWidth}
          />
        </StyledInviteFieldGroup>
        {isLoading ? (
          <Loading size={30} />
        ) : (
          <>
            {!mailEnabled && (
              <MailConfigContainer>
                {allUsers.length === 0 && <NoEmailConfigImage />}
                <span>You haven’t setup any email service yet</span>
                <a
                  href="https://docs.appsmith.com/v/v1.2.1/setup/docker/email"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Please configure your email service to invite people
                </a>
              </MailConfigContainer>
            )}
            <UserList ref={userRef} style={{ justifyContent: "space-between" }}>
              {allUsersProfiles.map(
                (user: {
                  username: string;
                  name: string;
                  roleName: string;
                  initials: string;
                }) => {
                  return (
                    <Fragment key={user.username}>
                      <User>
                        <UserInfo>
                          <ProfileImage
                            source={`/api/${UserApi.photoURL}/${user.username}`}
                            userName={user.name || user.username}
                          />
                          <UserName>
                            <Text type={TextType.H5}>{user.name}</Text>
                            <Text type={TextType.P2}>{user.username}</Text>
                          </UserName>
                        </UserInfo>
                        <UserRole>
                          <Text type={TextType.P1}>{user.roleName}</Text>
                        </UserRole>
                      </User>

                      <RoleDivider />
                    </Fragment>
                  );
                },
              )}
              <ScrollIndicator containerRef={userRef} mode="DARK" />
            </UserList>
          </>
        )}
        <ErrorBox message={submitSucceeded || submitFailed}>
          {submitSucceeded && (
            <Callout
              fill
              text={
                numberOfUsersInvited > 1
                  ? INVITE_USERS_SUBMIT_SUCCESS()
                  : INVITE_USER_SUBMIT_SUCCESS()
              }
              variant={Variant.success}
            />
          )}
          {((submitFailed && error) || emailError) && (
            <Callout fill text={error || emailError} variant={Variant.danger} />
          )}
        </ErrorBox>
        {canManage && <ManageUsers orgId={props.orgId} />}
      </StyledForm>
    </OrgInviteWrapper>
  );
}

export default connect(
  (state: AppState) => {
    return {
      roles: getRolesForField(state),
      allUsers: getAllUsers(state),
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
