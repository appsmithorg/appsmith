export * from "ce/pages/workspace/WorkspaceInviteUsersForm";
import {
  ErrorBox,
  InviteButtonWidth,
  InviteModalStyles,
  LabelText,
  Loading,
  MailConfigContainer,
  RoleDivider,
  StyledForm,
  StyledInviteFieldGroup,
  User,
  UserInfo,
  UserList,
  UserName,
  UserRole,
  WorkspaceInviteTitle,
  WorkspaceInviteWrapper,
} from "ce/pages/workspace/WorkspaceInviteUsersForm";
import React, {
  Fragment,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import styled, { ThemeContext } from "styled-components";
import { reduxForm, SubmissionError } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import { connect, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  getRolesForField,
  getAllUsers,
  getCurrentAppWorkspace,
  getGroupSuggestions,
} from "@appsmith/selectors/workspaceSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  InviteUsersToWorkspaceFormValues,
  inviteUsersToWorkspace,
} from "./helpers";
import { INVITE_USERS_TO_WORKSPACE_FORM } from "@appsmith/constants/forms";
import {
  createMessage,
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USER_SUBMIT_SUCCESS,
  INVITE_USERS_VALIDATION_EMAILS_EMPTY,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
  INVITE_USERS_VALIDATION_ROLE_EMPTY,
} from "@appsmith/constants/messages";
import { INVITE_USERS_VALIDATION_EMAIL_LIST as CE_INVITE_USERS_VALIDATION_EMAIL_LIST } from "ce/constants/messages";
import { isEmail } from "utils/formhelpers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { ReactComponent as NoEmailConfigImage } from "assets/images/email-not-configured.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Button,
  Callout,
  CalloutV2,
  DropdownOption,
  Icon,
  IconSize,
  ScrollIndicator,
  Size,
  Text,
  TextType,
  Variant,
} from "design-system-old";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import ProfileImage from "pages/common/ProfileImage";
import ManageUsers from "pages/workspace/ManageUsers";
import UserApi from "@appsmith/api/UserApi";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { useHistory } from "react-router-dom";
import { getAppsmithConfigs } from "@appsmith/configs";
import store from "store";
import TagListField from "../../utils/TagInput";
import { showAdminSettings } from "@appsmith/utils/adminSettingsHelpers";
import { getCurrentUser } from "selectors/usersSelectors";

const { cloudHosting, mailEnabled } = getAppsmithConfigs();

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
  .wrapper {
    .user-icons {
      margin-right: 8px;
    }
  }
`;

const StyledUserList = styled(UserList)`
  .user-icons {
    width: 34px;
    height: 34px;
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
        label: props.selected.name,
        value: props.selected.name,
        id: props.selected.id,
      },
    [selectedId],
  );

  const {
    allUsers,
    anyTouched,
    disableEmailSetup = false,
    disableManageUsers = false,
    disableUserList = false,
    dropdownPlaceholder = "",
    error,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchGroupSuggestions,
    fetchUser,
    handleSubmit,
    isAclFlow = false,
    isApplicationInvite,
    isLoading,
    isMultiSelectDropdown = false,
    message = "",
    onSubmitHandler,
    placeholder = "",
    submitFailed,
    submitSucceeded,
    submitting,
    valid,
  } = props;

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

  useEffect(() => {
    if (!isAclFlow) {
      fetchUser(props.workspaceId);
      fetchAllRoles(props.workspaceId);
      fetchCurrentWorkspace(props.workspaceId);
      fetchGroupSuggestions();
    }
  }, [
    props.workspaceId,
    fetchUser,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchGroupSuggestions,
  ]);

  useEffect(() => {
    if (selected) {
      setSelectedOption([selected]);
      props.initialize({
        role: [selected],
      });
    }
  }, []);

  const styledRoles =
    props.options && isAclFlow
      ? props.options.length > 0
        ? props.options
        : []
      : props.roles.map((role: any) => {
          return {
            id: role.id,
            value: role.name?.split(" - ")[0],
            label: role.description,
          };
        });

  if (isEEFeature && showAdminSettings(user)) {
    styledRoles.push({
      id: "custom-pg",
      value: "Assign Custom Role",
      link: "/settings/groups",
      icon: "right-arrow",
    });
  }

  const theme = useContext(ThemeContext);

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

  const onSelect = (_value?: string, option?: any) => {
    if (option.link) {
      history.push(option.link);
    }
    setSelectedOption(isMultiSelectDropdown ? option : [option]);
  };

  const onRemoveOptions = (updatedItems: any) => {
    setSelectedOption(updatedItems);
  };

  const getLabel = (selectedOption: Partial<DropdownOption>[]) => {
    return (
      <span data-testid="t--dropdown-label" style={{ width: "100%" }}>
        <Text type={TextType.P1}>{`${
          selected
            ? selectedOption[0].label
            : `${selectedOption?.length} Selected`
        }`}</Text>
      </span>
    );
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
      <InviteModalStyles />
      {isApplicationInvite && (
        <WorkspaceInviteTitle>
          <Text type={TextType.H5}>
            Invite users to {currentWorkspace?.name}{" "}
          </Text>
        </WorkspaceInviteTitle>
      )}
      {isEEFeature && (
        <CalloutV2
          actionLabel="Learn More"
          desc={
            "You can now invite users or entire groups and give them permissions"
          }
          showCrossIcon
          title="Granular access control is here!"
          type="Notify"
          url="https://docs.appsmith.com/advanced-concepts/access-control/granular-access-control"
        />
      )}
      <StyledForm
        onSubmit={handleSubmit((values: any, dispatch: any) => {
          validateFormValues(values, isAclFlow);
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
                  groups: groupsData,
                  numberOfGroupsInvited: groupsArray.length,
                }
              : {}),
            users: usersStr,
            numberOfUsersInvited: usersArray.length,
            role: values.role,
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
              permissionGroupId: isMultiSelectDropdown
                ? selectedOption.map((group: any) => group.id).join(",")
                : selectedOption[0].id,
            },
            dispatch,
          );
        })}
      >
        <LabelText type={TextType.P0}>{message}</LabelText>
        <StyledInviteFieldGroupEE>
          <div className="wrapper">
            <TagListField
              autofocus
              customError={(err: string, values?: string[]) =>
                errorHandler(err, values || [])
              }
              data-cy="t--invite-email-input"
              intent="success"
              label="Emails"
              name="users"
              placeholder={placeholder || "Enter email address(es)"}
              suggestionLeftIcon={
                <Icon
                  className="user-icons"
                  name="group-line"
                  size={IconSize.XXL}
                />
              }
              suggestions={isEEFeature ? groupSuggestions : undefined}
              type="text"
            />
            <SelectField
              allowDeselection={isMultiSelectDropdown}
              data-cy="t--invite-role-input"
              disabled={props.disableDropdown}
              dropdownMaxHeight={props.dropdownMaxHeight}
              enableSearch={isAclFlow ? true : false}
              isMultiSelect={isMultiSelectDropdown}
              labelRenderer={(selected: Partial<DropdownOption>[]) =>
                getLabel(selected)
              }
              name={"role"}
              onSelect={(value, option) => onSelect(value, option)}
              options={styledRoles}
              outline={false}
              placeholder={dropdownPlaceholder || "Select a role"}
              removeSelectedOption={onRemoveOptions}
              {...(isAclFlow ? { selected: selectedOption } : {})}
              showLabelOnly={isMultiSelectDropdown}
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
        </StyledInviteFieldGroupEE>
        {isLoading ? (
          <Loading size={30} />
        ) : (
          <>
            {!mailEnabled && !disableEmailSetup && (
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
            {!disableUserList && (
              <StyledUserList
                ref={userRef}
                style={{ justifyContent: "space-between" }}
              >
                {allUsersProfiles.map(
                  (user: {
                    username: string;
                    name: string;
                    permissionGroupId: string;
                    permissionGroupName: string;
                    initials: string;
                    userGroupId: string;
                    userId: string;
                  }) => {
                    return (
                      <Fragment
                        key={
                          user?.userGroupId ? user.userGroupId : user.username
                        }
                      >
                        <User>
                          <UserInfo>
                            {user?.userGroupId ? (
                              <>
                                <Icon
                                  className="user-icons"
                                  name="group-line"
                                  size={IconSize.XXL}
                                />
                                <UserName>
                                  <Text type={TextType.H5}>{user.name}</Text>
                                </UserName>
                              </>
                            ) : (
                              <>
                                <ProfileImage
                                  source={`/api/${UserApi.photoURL}/${user.username}`}
                                  userName={user.name || user.username}
                                />
                                <UserName>
                                  <Text type={TextType.H5}>{user.name}</Text>
                                  <Text type={TextType.P2}>
                                    {user.username}
                                  </Text>
                                </UserName>
                              </>
                            )}
                          </UserInfo>
                          <UserRole>
                            <Text type={TextType.P1}>
                              {user.permissionGroupName?.split(" - ")[0]}
                            </Text>
                          </UserRole>
                        </User>

                        <RoleDivider />
                      </Fragment>
                    );
                  },
                )}
                <ScrollIndicator containerRef={userRef} mode="DARK" />
              </StyledUserList>
            )}
          </>
        )}
        <ErrorBox message={submitSucceeded || submitFailed}>
          {submitSucceeded && (
            <Callout
              fill
              text={
                numberOfUsersInvited > 1
                  ? createMessage(INVITE_USERS_SUBMIT_SUCCESS)
                  : createMessage(INVITE_USER_SUBMIT_SUCCESS)
              }
              variant={Variant.success}
            />
          )}
          {((submitFailed && error) || emailError) && (
            <Callout fill text={error || emailError} variant={Variant.danger} />
          )}
        </ErrorBox>
        {canManage && !disableManageUsers && (
          <ManageUsers workspaceId={props.workspaceId} />
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
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_ROLES_INIT,
        payload: {
          workspaceId,
        },
      }),
    fetchCurrentWorkspace: (workspaceId: string) =>
      dispatch(fetchWorkspace(workspaceId)),
    fetchUser: (workspaceId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
        payload: {
          workspaceId,
        },
      }),
    fetchGroupSuggestions: () =>
      dispatch({
        type: ReduxActionTypes.FETCH_GROUP_SUGGESTIONS,
      }),
  }),
)(
  reduxForm<
    InviteUsersToWorkspaceFormValues,
    {
      fetchAllRoles: (workspaceId: string) => void;
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
