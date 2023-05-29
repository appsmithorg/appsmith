export * from "ce/pages/workspace/WorkspaceInviteUsersForm";
import {
  ErrorBox,
  ErrorTextContainer,
  MailConfigContainer,
  ManageUsersContainer,
  StyledForm,
  StyledInviteFieldGroup,
  User,
  UserInfo,
  UserList,
  UserName,
  UserRole,
  WorkspaceInviteWrapper,
} from "ce/pages/workspace/WorkspaceInviteUsersForm";
import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { reduxForm, SubmissionError } from "redux-form";
import { connect, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  getRolesForField,
  getAllUsers,
  getCurrentAppWorkspace,
  getGroupSuggestions,
} from "@appsmith/selectors/workspaceSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { InviteUsersToWorkspaceFormValues } from "./helpers";
import { inviteUsersToWorkspace } from "./helpers";
import { INVITE_USERS_TO_WORKSPACE_FORM } from "@appsmith/constants/forms";
import {
  createMessage,
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USER_SUBMIT_SUCCESS,
  INVITE_USERS_VALIDATION_EMAILS_EMPTY,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
  INVITE_USERS_VALIDATION_ROLE_EMPTY,
  USERS_HAVE_ACCESS_TO_ALL_APPS,
  USERS_HAVE_ACCESS_TO_ONLY_THIS_APP,
  NO_USERS_INVITED,
} from "@appsmith/constants/messages";
import { INVITE_USERS_VALIDATION_EMAIL_LIST as CE_INVITE_USERS_VALIDATION_EMAIL_LIST } from "ce/constants/messages";
import { isEmail } from "utils/formhelpers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getInitialsFromName } from "utils/AppsmithUtils";
import ManageUsers from "pages/workspace/ManageUsers";
import {
  fetchRolesForWorkspace,
  fetchUsersForWorkspace,
  fetchWorkspace,
} from "@appsmith/actions/workspaceActions";
import { useHistory } from "react-router-dom";
import { getAppsmithConfigs } from "@appsmith/configs";
import store from "store";
import TagListField from "../../utils/TagInput";
import { showAdminSettings } from "@appsmith/utils/adminSettingsHelpers";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getAllAppUsers,
  getAppRolesForField,
} from "@appsmith/selectors/applicationSelectors";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import {
  fetchRolesForApplication,
  fetchUsersForApplication,
} from "@appsmith/actions/applicationActions";
import { ENTITY_TYPE } from "@appsmith/constants/workspaceConstants";
import type { WorkspaceUserRoles } from "@appsmith/constants/workspaceConstants";
import {
  Avatar,
  Button,
  Callout,
  Icon,
  Option,
  Select,
  Spinner,
  Text,
  Tooltip,
  toast,
} from "design-system";
import { importSvg } from "design-system-old";

const NoEmailConfigImage = importSvg(
  () => import("assets/images/email-not-configured.svg"),
);

const { cloudHosting } = getAppsmithConfigs();

const validateFormValues = (
  values: {
    users: string;
    role?: string | string[];
  },
  isAclFlow: boolean,
) => {
  if (values.users && values.users.length > 0) {
    const _users = values.users.split(",").filter(Boolean);

    _users.forEach((user) => {
      if (!isEmail(user) && !isUserGroup(user)) {
        throw new SubmissionError({
          _error: createMessage(
            isAclFlow
              ? CE_INVITE_USERS_VALIDATION_EMAIL_LIST
              : INVITE_USERS_VALIDATION_EMAIL_LIST,
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
      if (!isEmail(user) && !isUserGroup(user)) {
        errors["users"] = createMessage(
          INVITE_USERS_VALIDATION_EMAIL_LIST,
          cloudHosting,
        );
      }
    });
  }
  return errors;
};

const isUserGroup = (user: string) => {
  return getGroupSuggestions(store.getState())?.some(
    (ug: any) => ug.id === user,
  );
};

const StyledInviteFieldGroupEE = styled(StyledInviteFieldGroup)`
  .user-icons {
    margin-right: 8px;
  }
`;

const StyledUserList = styled(UserList)`
  .user-icons {
    width: 32px;
    justify-content: center;
  }
`;

function WorkspaceInviteUsersForm(props: any) {
  const [emailError, setEmailError] = useState("");
  const [selectedOption, setSelectedOption] = useState<any[]>([]);
  const user = useSelector(getCurrentUser);
  const userRef = React.createRef<HTMLDivElement>();
  const history = useHistory();
  const selectedId = props?.selected?.id;

  const selected = useMemo(
    () =>
      selectedId &&
      props.selected && {
        description: props.selected.name,
        value: props.selected.name,
        key: props.selected.id,
      },
    [selectedId],
  );

  const {
    allUsers,
    anyTouched,
    customProps = {},
    error,
    fetchAllAppRoles,
    fetchAllAppUsers,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchGroupSuggestions,
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
    dropdownPlaceholder = "",
    isAclFlow = false,
    onSubmitHandler,
  } = customProps;

  // set state for checking number of users invited
  const [numberOfUsersInvited, updateNumberOfUsersInvited] = useState(0);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const groupSuggestions: any[] = useSelector(getGroupSuggestions);

  const userWorkspacePermissions = currentWorkspace?.userPermissions ?? [];
  const canManage = isPermitted(
    userWorkspacePermissions,
    PERMISSION_TYPE.MANAGE_WORKSPACE,
  );
  const isEEFeature = (!isAclFlow && !cloudHosting) || false;
  const isAppLevelInvite = (!cloudHosting && isApplicationInvite) || false;

  useEffect(() => {
    setSelectedOption([]);
  }, [submitSucceeded]);

  useEffect(() => {
    if (!isAclFlow) {
      if (isAppLevelInvite) {
        fetchAllAppUsers(props.applicationId);
        fetchAllAppRoles(props.applicationId);
      } else {
        fetchUser(props.workspaceId);
        fetchAllRoles(props.workspaceId);
      }
      fetchCurrentWorkspace(props.workspaceId);
      fetchGroupSuggestions();
    }
  }, [
    props.workspaceId,
    fetchUser,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchGroupSuggestions,
    fetchAllAppRoles,
    fetchAllAppUsers,
    props.applicationId,
    isAppLevelInvite,
  ]);

  useEffect(() => {
    if (selected) {
      setSelectedOption([selected]);
      props.initialize({
        role: [selected],
      });
    }
  }, []);

  useEffect(() => {
    if (submitSucceeded) {
      toast.show(
        numberOfUsersInvited > 1
          ? createMessage(INVITE_USERS_SUBMIT_SUCCESS)
          : createMessage(INVITE_USER_SUBMIT_SUCCESS),
        { kind: "success" },
      );
    }
  }, [submitSucceeded]);

  const styledRoles =
    props.options && isAclFlow
      ? props.options.length > 0
        ? props.options
        : []
      : props.roles.map((role: any) => {
          return {
            key: role.id,
            value: role.name?.split(" - ")[0],
            description: role.description,
          };
        });

  if (isEEFeature && showAdminSettings(user)) {
    styledRoles.push({
      key: "custom-pg",
      value: "Assign Custom Role",
      link: "/settings/groups",
      icon: "right-arrow",
    });
  }

  const allUsersProfiles = React.useMemo(
    () =>
      allUsers.map(
        (user: {
          userId: string;
          userGroupId: string;
          username: string;
          permissionGroupId: string;
          permissionGroupName: string;
          name: string;
        }) => {
          return {
            ...user,
            initials: getInitialsFromName(user.name || user.username),
          };
        },
      ),
    [allUsers],
  );

  const onSelect = (value: string, option?: any) => {
    if (option.value === "custom-pg") {
      history.push("/settings/groups");
    }
    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) => [...selectedOptions, option]);
    } else {
      setSelectedOption([option]);
    }
  };

  const onRemoveOptions = (value: string, option?: any) => {
    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) =>
        selectedOptions.filter((opt) => opt.value !== option.value),
      );
    }
  };

  const errorHandler = (error: string, values: string[]) => {
    if (values && values.length > 0) {
      const hasInvalidUser = values.some(
        (user) => !isEmail(user) && !isUserGroup(user),
      );
      let error = "";
      if (hasInvalidUser) {
        error = isAclFlow
          ? createMessage(CE_INVITE_USERS_VALIDATION_EMAIL_LIST, cloudHosting)
          : createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST, cloudHosting);
      }
      setEmailError(error);
    } else {
      props.customError?.("");
    }
  };

  return (
    <WorkspaceInviteWrapper>
      <StyledForm
        onSubmit={handleSubmit((values: any, dispatch: any) => {
          const roles = isMultiSelectDropdown
            ? selectedOption.map((option: any) => option.value).join(",")
            : selectedOption[0].value;
          validateFormValues({ ...values, role: roles }, isAclFlow);
          const usersAsStringsArray = values.users.split(",");
          // update state to show success message correctly
          updateNumberOfUsersInvited(usersAsStringsArray.length);
          const usersArray = usersAsStringsArray.filter((user: any) =>
            isEmail(user),
          );
          const groupsArray = usersAsStringsArray.filter(
            (user: any) => !isEmail(user),
          );
          const usersStr = usersArray.join(",");
          const groupsStr = groupsArray.join(",");
          const groupsData = [];
          for (const gId of groupsArray) {
            const data = groupSuggestions.find((g) => g.id === gId);
            data && groupsData.push(data);
          }
          AnalyticsUtil.logEvent("INVITE_USER", {
            ...(isEEFeature
              ? {
                  groups: groupsData.map((grp: any) => grp.id),
                  numberOfGroupsInvited: groupsArray.length,
                }
              : {}),
            ...(cloudHosting ? { users: usersStr } : {}),
            numberOfUsersInvited: usersArray.length,
            role: roles,
          });
          if (onSubmitHandler) {
            return onSubmitHandler({
              ...(props.workspaceId ? { workspaceId: props.workspaceId } : {}),
              users: usersStr,
              options: isMultiSelectDropdown
                ? selectedOption
                : selectedOption[0],
            });
          }
          return inviteUsersToWorkspace(
            {
              ...(isEEFeature ? { groups: groupsStr } : {}),
              ...(props.workspaceId ? { workspaceId: props.workspaceId } : {}),
              users: usersStr,
              permissionGroupId: roles,
              isApplicationInvite: isAppLevelInvite,
              ...(isAppLevelInvite
                ? {
                    applicationId: props.applicationId,
                    roleType: selectedOption[0].value,
                  }
                : {}),
            },
            dispatch,
          );
        })}
      >
        {!isAclFlow && (
          <div className="flex gap-2 mb-2">
            <Text
              color="var(--ads-v2-color-fg)"
              data-testid="helper-message"
              kind="action-m"
            >
              {isAppLevelInvite
                ? createMessage(USERS_HAVE_ACCESS_TO_ONLY_THIS_APP)
                : createMessage(USERS_HAVE_ACCESS_TO_ALL_APPS)}
            </Text>
          </div>
        )}

        <StyledInviteFieldGroupEE>
          <div style={{ width: "60%" }}>
            <TagListField
              autofocus
              customError={(err: string, values?: string[]) =>
                errorHandler(err, values || [])
              }
              data-testid="t--invite-email-input"
              intent="success"
              label="Emails"
              name="users"
              placeholder={placeholder || "Enter email address(es)"}
              suggestionLeftIcon={
                <Icon className="user-icons" name="group-line" size="md" />
              }
              suggestions={isEEFeature ? groupSuggestions : undefined}
              type="text"
            />
            {emailError && (
              <ErrorTextContainer>
                <Icon name="alert-line" size="sm" />
                <Text kind="body-s" renderAs="p">
                  {emailError}
                </Text>
              </ErrorTextContainer>
            )}
          </div>
          <div style={{ width: "40%" }}>
            <Select
              data-testid="t--invite-role-input"
              filterOption={(input, option) =>
                (option &&
                  option.label &&
                  option.label
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())) ||
                false
              }
              getPopupContainer={(triggerNode) =>
                triggerNode.parentNode.parentNode
              }
              isDisabled={disableDropdown}
              isMultiSelect={isMultiSelectDropdown}
              listHeight={isAclFlow ? 200 : 400}
              onDeselect={onRemoveOptions}
              onSelect={onSelect}
              optionLabelProp="label"
              placeholder={dropdownPlaceholder || "Select a role"}
              showSearch={isAclFlow ? true : false}
              value={selectedOption}
            >
              {styledRoles.map((role: any) => (
                <Option
                  key={isAppLevelInvite ? role.value : role.key}
                  label={role.value}
                  value={isAppLevelInvite ? role.value : role.key}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                      {role.icon && <Icon name={role.icon} size="md" />}
                      <Text
                        color="var(--ads-v2-color-fg-emphasis)"
                        kind={role.description && "heading-xs"}
                      >
                        {role.value}
                      </Text>
                    </div>
                    {role.description && (
                      <Text kind="body-s">{role.description}</Text>
                    )}
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
              type="submit"
            >
              Invite
            </Button>
          </div>
        </StyledInviteFieldGroupEE>

        {isLoading ? (
          <div className="pt-4 overflow-hidden">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {allUsers.length === 0 && !disableUserList && (
              <MailConfigContainer data-testid="no-users-content">
                <NoEmailConfigImage />
                <Text kind="action-s">{createMessage(NO_USERS_INVITED)}</Text>
              </MailConfigContainer>
            )}
            {!disableUserList && (
              <StyledUserList ref={userRef}>
                {allUsersProfiles.map(
                  (user: {
                    username: string;
                    name: string;
                    roles: WorkspaceUserRoles[];
                    initials: string;
                    userGroupId: string;
                    userId: string;
                    photoId?: string;
                  }) => {
                    const showUser =
                      (isAppLevelInvite
                        ? user.roles?.[0]?.entityType ===
                          ENTITY_TYPE.APPLICATION
                        : user.roles?.[0]?.entityType ===
                          ENTITY_TYPE.WORKSPACE) && user.roles?.[0]?.id;
                    return showUser ? (
                      <User
                        key={
                          user?.userGroupId ? user.userGroupId : user.username
                        }
                      >
                        <UserInfo>
                          {user?.userGroupId ? (
                            <>
                              <Icon
                                className="user-icons"
                                name="group-line"
                                size="lg"
                              />
                              <UserName>
                                <Text
                                  color="var(--ads-v2-color-fg)"
                                  kind="heading-xs"
                                >
                                  {user.name}
                                </Text>
                              </UserName>
                            </>
                          ) : (
                            <>
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
                                <Tooltip
                                  content={user.username}
                                  placement="top"
                                >
                                  <Text
                                    color="var(--ads-v2-color-fg)"
                                    kind="heading-xs"
                                  >
                                    {user.name}
                                  </Text>
                                </Tooltip>
                              </UserName>
                            </>
                          )}
                        </UserInfo>
                        <UserRole>
                          <Text kind="action-m">
                            {user.roles?.[0]?.name?.split(" - ")[0] || ""}
                          </Text>
                        </UserRole>
                      </User>
                    ) : null;
                  },
                )}
              </StyledUserList>
            )}
          </>
        )}
        <ErrorBox message={submitFailed}>
          {submitFailed && error && <Callout kind="error">{error}</Callout>}
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
  (
    state: AppState,
    {
      formName,
      isApplicationInvite,
    }: { formName?: string; isApplicationInvite?: boolean },
  ): any => {
    const isAppLevelInvite = (!cloudHosting && isApplicationInvite) || false;
    return {
      roles: isAppLevelInvite
        ? getAppRolesForField(state)
        : getRolesForField(state),
      allUsers: isAppLevelInvite ? getAllAppUsers(state) : getAllUsers(state),
      isLoading: isAppLevelInvite
        ? state.ui.applications.loadingStates.isFetchAllUsers
        : state.ui.workspaces.loadingStates.isFetchAllUsers,
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
    fetchGroupSuggestions: () =>
      dispatch({
        type: ReduxActionTypes.FETCH_GROUP_SUGGESTIONS,
      }),
    fetchAllAppRoles: (applicationId: string) =>
      dispatch(fetchRolesForApplication(applicationId)),
    fetchAllAppUsers: (applicationId: string) =>
      dispatch(fetchUsersForApplication(applicationId)),
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
