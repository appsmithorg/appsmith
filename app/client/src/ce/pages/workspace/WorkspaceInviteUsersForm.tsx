import React, { useEffect, useState, useMemo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import TagListField from "components/editorComponents/form/fields/TagListField";
import { reduxForm, SubmissionError } from "redux-form";
import { connect, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  getRolesForField,
  getAllUsers,
  getCurrentAppWorkspace,
} from "@appsmith/selectors/workspaceSelectors";
import type { InviteUsersToWorkspaceFormValues } from "@appsmith/pages/workspace/helpers";
import { inviteUsersToWorkspace } from "@appsmith/pages/workspace/helpers";
import { INVITE_USERS_TO_WORKSPACE_FORM } from "@appsmith/constants/forms";
import {
  createMessage,
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USER_SUBMIT_SUCCESS,
  INVITE_USERS_VALIDATION_EMAILS_EMPTY,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
  INVITE_USERS_VALIDATION_ROLE_EMPTY,
  USERS_HAVE_ACCESS_TO_ALL_APPS,
  NO_USERS_INVITED,
} from "@appsmith/constants/messages";
import { isEmail } from "utils/formhelpers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ReactComponent as NoEmailConfigImage } from "assets/images/email-not-configured.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { DropdownOption } from "design-system-old";
import {
  Callout,
  Avatar,
  Button,
  Icon,
  Select,
  Spinner,
  Text,
  Option,
} from "design-system";
import { getInitialsFromName } from "utils/AppsmithUtils";
import ManageUsers from "pages/workspace/ManageUsers";
import {
  fetchRolesForWorkspace,
  fetchUsersForWorkspace,
  fetchWorkspace,
} from "@appsmith/actions/workspaceActions";
import { useHistory } from "react-router-dom";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import type { WorkspaceUserRoles } from "@appsmith/constants/workspaceConstants";

const { cloudHosting } = getAppsmithConfigs();

export const WorkspaceInviteWrapper = styled.div`
  > div {
    margin-top: 0;
  }
`;

export const StyledForm = styled.form`
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

export const ErrorBox = styled.div<{ message?: boolean }>`
  ${(props) =>
    props.message ? `margin: ${props.theme.spaces[9]}px 0px;` : null};
`;

export const StyledInviteFieldGroup = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  .wrapper {
    display: flex;
    width: 85%;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    margin-right: ${(props) => props.theme.spaces[3]}px;
    border-right: 0px;
  }
`;

export const InviteModalStyles = createGlobalStyle`
    .label-container > * {
      word-break: break-word;
    }
`;

export const UserList = styled.div`
  margin-top: 24px;
  max-height: 260px;
  overflow-y: auto;
  &&::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.modal.scrollbar};
  }
`;

export const User = styled.div<{ isApplicationInvite?: boolean }>`
  display: flex;
  align-items: center;
  min-height: 54px;
  padding: 5px 0 5px 15px;
  justify-content: space-between;
  color: ${(props) => props.theme.colors.modal.user.textColor};
  border-bottom: 1px solid ${(props) => props.theme.colors.menuBorder};

  &:last-child {
    ${({ isApplicationInvite }) =>
      isApplicationInvite && `border-bottom: none;`}
  }
`;

export const UserInfo = styled.div`
  display: inline-flex;
  align-items: center;
  div:first-child {
    cursor: default;
  }
`;

export const UserRole = styled.div`
  flex-basis: 40%;
  flex-shrink: 0;
  span {
    word-break: break-word;
  }
`;

export const UserName = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 10px;
  span {
    word-break: break-word;

    &:nth-child(1) {
      margin-bottom: 1px;
    }
  }
`;

export const MailConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 4px;
  padding-bottom: 0;
  align-items: center;
  && > span {
    color: ${(props) => props.theme.colors.modal.email.message};
    font-weight: 500;
    font-size: 14px;
  }
`;

const validateFormValues = (values: {
  users: string;
  role?: string;
  roles?: Partial<DropdownOption>[];
}) => {
  if (values.users && values.users.length > 0) {
    const _users = values.users.split(",").filter(Boolean);

    _users.forEach((user) => {
      if (!isEmail(user)) {
        throw new SubmissionError({
          _error: createMessage(
            INVITE_USERS_VALIDATION_EMAIL_LIST,
            cloudHosting,
          ),
        });
      }
    });
  } else {
    throw new SubmissionError({
      _error: createMessage(INVITE_USERS_VALIDATION_EMAILS_EMPTY),
    });
  }

  if (typeof values.role === "undefined" || values.role.length === 0) {
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

  if (typeof values.role === "undefined" || values.role.length === 0) {
    errors["role"] = createMessage(INVITE_USERS_VALIDATION_ROLE_EMPTY);
  }

  if (values.users && values.users.length > 0) {
    const _users = values.users.split(",").filter(Boolean);

    _users.forEach((user: string) => {
      if (!isEmail(user)) {
        errors["users"] = createMessage(
          INVITE_USERS_VALIDATION_EMAIL_LIST,
          cloudHosting,
        );
      }
    });
  }
  return errors;
};

function WorkspaceInviteUsersForm(props: any) {
  const [emailError, setEmailError] = useState("");
  const [selectedOption, setSelectedOption] = useState<any[]>([]);
  const userRef = React.createRef<HTMLDivElement>();
  const history = useHistory();
  const selectedId = props?.selected?.id;

  const selected = useMemo(
    () =>
      selectedId &&
      props.selected && {
        label: props.selected.rolename,
        value: props.selected.rolename,
        id: props.selected.id,
      },
    [selectedId],
  );

  const {
    allUsers,
    anyTouched,
    disableManageUsers = false,
    disableUserList = false,
    error,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchUser,
    handleSubmit,
    isApplicationInvite = false,
    isLoading,
    isMultiSelectDropdown = false,
    placeholder = "",
    submitFailed,
    submitSucceeded,
    submitting,
    valid,
  } = props;

  // set state for checking number of users invited
  const [numberOfUsersInvited, updateNumberOfUsersInvited] = useState(0);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);

  const userWorkspacePermissions = currentWorkspace?.userPermissions ?? [];
  const canManage = isPermitted(
    userWorkspacePermissions,
    PERMISSION_TYPE.MANAGE_WORKSPACE,
  );

  useEffect(() => {
    fetchUser(props.workspaceId);
    fetchAllRoles(props.workspaceId);
    fetchCurrentWorkspace(props.workspaceId);
  }, [props.workspaceId, fetchUser, fetchAllRoles, fetchCurrentWorkspace]);

  useEffect(() => {
    if (selected) {
      setSelectedOption([selected]);
      props.initialize({
        role: [selected],
      });
    }
  }, []);

  const styledRoles =
    props.options && props.options.length > 0
      ? props.options
      : props.roles.map((role: any) => {
          return {
            id: role.id,
            value: role.name?.split(" - ")[0],
            label: role.description,
          };
        });

  const allUsersProfiles = React.useMemo(
    () =>
      allUsers.map(
        (user: {
          userId: string;
          username: string;
          permissionGroupId: string;
          permissionGroupName: string;
          name: string;
        }) => ({
          ...user,
          initials: getInitialsFromName(user.name || user.username),
        }),
      ),
    [allUsers],
  );

  const onSelect = (_value: string, option: any) => {
    if (option.link) {
      history.push(option.link);
    }

    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) => [...selectedOptions, option]);
    } else {
      setSelectedOption([option]);
    }
  };

  const errorHandler = (error: string) => {
    setEmailError(error);
  };

  const onRemoveOptions = (value: string) => {
    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) =>
        selectedOptions.filter((option) => option.value !== value),
      );
    }
  };

  return (
    <WorkspaceInviteWrapper>
      <InviteModalStyles />
      <StyledForm
        onSubmit={handleSubmit((values: any, dispatch: any) => {
          validateFormValues(values);
          const usersAsStringsArray = values.users.split(",");
          // update state to show success message correctly
          updateNumberOfUsersInvited(usersAsStringsArray.length);
          const users = usersAsStringsArray
            .filter((user: any) => isEmail(user))
            .join(",");
          AnalyticsUtil.logEvent("INVITE_USER", {
            ...(cloudHosting ? { users: usersAsStringsArray } : {}),
            role: isMultiSelectDropdown
              ? selectedOption.map((group: any) => group.id).join(",")
              : [selectedOption[0].id],
            numberOfUsersInvited: usersAsStringsArray.length,
          });
          return inviteUsersToWorkspace(
            {
              ...(props.workspaceId ? { workspaceId: props.workspaceId } : {}),
              users,
              permissionGroupId: isMultiSelectDropdown
                ? selectedOption.map((group: any) => group.id).join(",")
                : selectedOption[0].id,
            },
            dispatch,
          );
        })}
      >
        <StyledInviteFieldGroup>
          <div className="wrapper">
            <TagListField
              autofocus
              customError={(err: string) => errorHandler(err)}
              data-cy="t--invite-email-input"
              intent="success"
              label="Emails"
              name="users"
              placeholder={placeholder || "Enter email address(es)"}
              type="email"
            />
            <Select
              data-cy="t--invite-role-input"
              disabled={props.disableDropdown}
              isMultiSelect={isMultiSelectDropdown}
              // @ts-expect-error: Select name prop
              name="role"
              onDeselect={onRemoveOptions}
              onSelect={(value, option) => onSelect(value, option)}
              placeholder="Select a role"
              value={selectedOption.map(({ value }) => value)}
            >
              {styledRoles.map((role: any) => (
                <Option key={role.id} value={role.value}>
                  <div className="flex flex-col gap-1">
                    <Text kind="heading-xs">{role.value}</Text>
                    <Text kind="body-s">{role.label}</Text>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          <Button
            className="t--invite-user-btn"
            isDisabled={!valid}
            isLoading={submitting && !(submitFailed && !anyTouched)}
            size="md"
          >
            Invite
          </Button>
        </StyledInviteFieldGroup>

        <div className="flex gap-2 mt-2">
          <Icon name="user-3-line" size="sm" />
          <Text data-testid="helper-message" kind="action-m">
            {createMessage(USERS_HAVE_ACCESS_TO_ALL_APPS)}
          </Text>
        </div>

        {isLoading ? (
          <div className="p-4">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {allUsers.length === 0 && (
              <MailConfigContainer data-testid="no-users-content">
                <NoEmailConfigImage />
                <Text kind="action-s">{createMessage(NO_USERS_INVITED)}</Text>
              </MailConfigContainer>
            )}
            {!disableUserList && (
              <UserList
                ref={userRef}
                style={{ justifyContent: "space-between" }}
              >
                {allUsersProfiles.map(
                  (user: {
                    username: string;
                    name: string;
                    roles: WorkspaceUserRoles[];
                    initials: string;
                    photoId?: string;
                  }) => {
                    return (
                      <User
                        isApplicationInvite={isApplicationInvite}
                        key={user.username}
                      >
                        <UserInfo>
                          <Avatar
                            firstLetter={user.initials}
                            image={
                              user.photoId
                                ? `/api/${USER_PHOTO_ASSET_URL}/${user.photoId}`
                                : undefined
                            }
                            label={user.name || user.username}
                          />
                          <UserName>
                            <Text kind="heading-xs">{user.name}</Text>
                            <Text kind="body-s">{user.username}</Text>
                          </UserName>
                        </UserInfo>
                        <UserRole>
                          <Text kind="action-m">
                            {user.roles?.[0]?.name?.split(" - ")[0] || ""}
                          </Text>
                        </UserRole>
                      </User>
                    );
                  },
                )}
              </UserList>
            )}
          </>
        )}
        <ErrorBox message={submitSucceeded || submitFailed}>
          {submitSucceeded && (
            <Callout kind="success">
              {numberOfUsersInvited > 1
                ? createMessage(INVITE_USERS_SUBMIT_SUCCESS)
                : createMessage(INVITE_USER_SUBMIT_SUCCESS)}
            </Callout>
          )}
          {((submitFailed && error) || emailError) && (
            <Callout kind="error">{error || emailError}</Callout>
          )}
        </ErrorBox>
        {canManage && !disableManageUsers && (
          <ManageUsers
            isApplicationInvite={isApplicationInvite}
            workspaceId={props.workspaceId}
          />
        )}
      </StyledForm>
    </WorkspaceInviteWrapper>
  );
}

export default connect(
  (state: AppState, { formName }: { formName?: string }) => {
    return {
      roles: getRolesForField(state),
      allUsers: getAllUsers(state),
      isLoading: state.ui.workspaces.loadingStates.isFetchAllUsers,
      form: formName || INVITE_USERS_TO_WORKSPACE_FORM,
    };
  },
  (dispatch: any) => ({
    fetchAllRoles: (workspaceId: string) =>
      dispatch(fetchRolesForWorkspace(workspaceId)),
    fetchCurrentWorkspace: (workspaceId: string) =>
      dispatch(fetchWorkspace(workspaceId)),
    fetchUser: (workspaceId: string) =>
      dispatch(fetchUsersForWorkspace(workspaceId)),
  }),
)(
  reduxForm<
    InviteUsersToWorkspaceFormValues,
    {
      roles?: any;
      applicationId?: string;
      workspaceId?: string;
      isApplicationInvite?: boolean;
      placeholder?: string;
    }
  >({
    validate,
  })(WorkspaceInviteUsersForm),
);
