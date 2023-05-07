import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
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
import type { SelectOptionProps } from "design-system";
import {
  Callout,
  Avatar,
  Button,
  Select,
  Spinner,
  Text,
  Option,
  Tooltip,
} from "design-system";
import { getInitialsFromName } from "utils/AppsmithUtils";
import ManageUsers from "pages/workspace/ManageUsers";
import {
  fetchRolesForWorkspace,
  fetchUsersForWorkspace,
  fetchWorkspace,
} from "@appsmith/actions/workspaceActions";
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
  background: var(--ads-v2-color-bg);
  &&& {
    .wrapper > div:nth-child(1) {
      width: 60%;
    }
    .wrapper > div:nth-child(2) {
      width: 40%;
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
  gap: 0.8rem;
`;

export const UserList = styled.div`
  margin-top: 10px;
  max-height: 260px;
  overflow-y: auto;
  justify-content: space-between;
  margin-left: 0.1rem;
  &&::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.modal.scrollbar};
  }
`;

export const User = styled.div`
  display: flex;
  align-items: center;
  min-height: 54px;
  justify-content: space-between;
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

export const UserInfo = styled.div`
  display: inline-flex;
  align-items: center;
  div:first-child {
    cursor: default;
  }
`;

export const UserRole = styled.div`
  span {
    word-break: break-word;
    margin-right: 8px;
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
    color: var(--ads-v2-color-fg);
  }
`;

export const ManageUsersContainer = styled.div`
  padding: 12px 0;
`;

const validateFormValues = (values: {
  users: string;
  role?: string;
  roles?: Partial<SelectOptionProps>[];
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
  // const history = useHistory();
  const selectedId = props?.selected?.id;

  const selected = useMemo(
    () =>
      selectedId &&
      props.selected && {
        description: props.selected.rolename,
        value: props.selected.rolename,
        key: props.selected.id,
      },
    [selectedId],
  );

  const {
    allUsers,
    anyTouched,
    customProps = {},
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

  const {
    disableDropdown = false,
    disableManageUsers = false,
    disableUserList = false,
  } = customProps;

  // set state for checking number of users invited
  const [numberOfUsersInvited, updateNumberOfUsersInvited] = useState(0);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);

  const userWorkspacePermissions = currentWorkspace?.userPermissions ?? [];
  const canManage = isPermitted(
    userWorkspacePermissions,
    PERMISSION_TYPE.MANAGE_WORKSPACE,
  );

  useEffect(() => {
    setSelectedOption([]);
  }, [submitSucceeded]);

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
            key: role.id,
            value: role.name?.split(" - ")[0],
            description: role.description,
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

  const onSelect = (value: string, option?: any) => {
    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) => [...selectedOptions, option]);
    } else {
      setSelectedOption([option]);
    }
  };

  const errorHandler = (error: string) => {
    setEmailError(error);
  };

  const onRemoveOptions = (value: string, option?: any) => {
    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) =>
        selectedOptions.filter((opt) => opt.value !== option.value),
      );
    }
  };

  return (
    <WorkspaceInviteWrapper>
      <StyledForm
        onSubmit={handleSubmit((values: any, dispatch: any) => {
          const roles = isMultiSelectDropdown
            ? selectedOption.map((option: any) => option.value).join(",")
            : selectedOption[0].value;
          validateFormValues({ ...values, role: roles });
          const usersAsStringsArray = values.users.split(",");
          // update state to show success message correctly
          updateNumberOfUsersInvited(usersAsStringsArray.length);
          const users = usersAsStringsArray
            .filter((user: any) => isEmail(user))
            .join(",");
          AnalyticsUtil.logEvent("INVITE_USER", {
            ...(cloudHosting ? { users: usersAsStringsArray } : {}),
            role: roles,
            numberOfUsersInvited: usersAsStringsArray.length,
          });
          return inviteUsersToWorkspace(
            {
              ...(props.workspaceId ? { workspaceId: props.workspaceId } : {}),
              users,
              permissionGroupId: roles,
            },
            dispatch,
          );
        })}
      >
        <div className="flex gap-2 mb-2">
          <Text
            color="var(--ads-v2-color-gray-600)"
            data-testid="helper-message"
            kind="action-m"
          >
            {createMessage(USERS_HAVE_ACCESS_TO_ALL_APPS)}
          </Text>
        </div>

        <StyledInviteFieldGroup>
          <div style={{ width: "60%" }}>
            <TagListField
              autofocus
              customError={(err: string) => errorHandler(err)}
              data-testid="t--invite-email-input"
              intent="success"
              label="Emails"
              name="users"
              placeholder={placeholder || "Enter email address(es)"}
              type="email"
            />
          </div>
          <div style={{ width: "40%" }}>
            <Select
              data-testid="t--invite-role-input"
              isDisabled={disableDropdown}
              isMultiSelect={isMultiSelectDropdown}
              onDeselect={onRemoveOptions}
              onSelect={onSelect}
              optionLabelProp="label"
              placeholder="Select a role"
              value={selectedOption}
            >
              {styledRoles.map((role: any) => (
                <Option key={role.key} label={role.value} value={role.key}>
                  <div className="flex flex-col gap-1">
                    <Text
                      color="var(--ads-v2-color-fg-emphasis)"
                      kind={role.description && "heading-xs"}
                    >
                      {role.value}
                    </Text>
                    <Text kind="body-s">{role.description}</Text>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <Button
              className="t--invite-user-btn"
              isDisabled={!valid || selectedOption.length === 0}
              isLoading={submitting && !(submitFailed && !anyTouched)}
              size="md"
            >
              Invite
            </Button>
          </div>
        </StyledInviteFieldGroup>

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
              <UserList ref={userRef}>
                {allUsersProfiles.map(
                  (user: {
                    username: string;
                    name: string;
                    roles: WorkspaceUserRoles[];
                    initials: string;
                    photoId?: string;
                  }) => {
                    return (
                      <User key={user.username}>
                        <UserInfo>
                          <Avatar
                            firstLetter={user.initials}
                            image={
                              user.photoId
                                ? `/api/${USER_PHOTO_ASSET_URL}/${user.photoId}`
                                : undefined
                            }
                            isTooltipEnabled={false}
                            label={user.name || user.username}
                          />
                          <UserName>
                            <Tooltip content={user.username} placement="top">
                              <Text
                                color="var(--ads-v2-color-fg)"
                                kind="heading-xs"
                              >
                                {user.name}
                              </Text>
                            </Tooltip>
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
          <ManageUsersContainer>
            <ManageUsers
              isApplicationInvite={isApplicationInvite}
              workspaceId={props.workspaceId}
            />
          </ManageUsersContainer>
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
      customProps?: any;
      selected?: any;
      options?: any;
      isMultiSelectDropdown?: boolean;
    }
  >({
    validate,
  })(WorkspaceInviteUsersForm),
);
