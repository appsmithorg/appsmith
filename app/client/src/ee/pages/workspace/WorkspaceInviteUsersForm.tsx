export * from "ce/pages/workspace/WorkspaceInviteUsersForm";
import { default as CE_WorkspaceInviteUsersForm } from "ce/pages/workspace/WorkspaceInviteUsersForm";
import {
  ErrorBox,
  InviteButtonWidth,
  InviteModalStyles,
  LabelText,
  Loading,
  MailConfigContainer,
  mailEnabled,
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
import TagListField from "components/editorComponents/form/fields/TagListField";
import { reduxForm, SubmissionError } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import { connect, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  getRolesForField,
  getAllUsers,
  getCurrentAppWorkspace,
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
import { isEmail } from "utils/formhelpers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import { ReactComponent as NoEmailConfigImage } from "assets/images/email-not-configured.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Button,
  Size,
  Text,
  TextType,
  Icon,
  IconSize,
  DropdownOption,
} from "design-system";
import { Variant } from "components/ads/common";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import ProfileImage from "pages/common/ProfileImage";
import ManageUsers from "pages/workspace/ManageUsers";
import { Callout, CalloutV2, ScrollIndicator } from "design-system";
import UserApi from "@appsmith/api/UserApi";
import { fetchWorkspace } from "actions/workspaceActions";
import { useHistory } from "react-router-dom";
/*import { selectFeatureFlags } from "selectors/usersSelectors";*/
import { getAppsmithConfigs } from "@appsmith/configs";

const { cloudHosting } = getAppsmithConfigs();

const validateFormValues = (values: {
  users: string;
  role?: string | string[];
}) => {
  if (values.users && values.users.length > 0) {
    const _users = values.users.split(",").filter(Boolean);

    _users.forEach((user) => {
      if (!isEmail(user) && !isUserGroup(user)) {
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
        errors["users"] = createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST);
      }
    });
  }
  return errors;
};

const isUserGroup = (user: string) => {
  if (listOfUGs.some((ug) => ug.name === user)) {
    return true;
  }
  return false;
};

const getUserGroupId = (user: string) => {
  const ug = listOfUGs.find((ug) => ug.name === user);
  return ug?.id || "";
};

const listOfUGs = [
  {
    id: "1",
    name: "design",
  },
  {
    id: "2",
    name: "hr",
  },
  {
    id: "3",
    name: "tester",
  },
];

const StyledInviteFieldGroupEE = styled(StyledInviteFieldGroup)`
  .wrapper {
    .user-icons {
      margin-right: 8px;
    }
  }
`;

function WorkspaceInviteUsersForm(props: any) {
  const [emailError, setEmailError] = useState("");
  const [selectedOption, setSelectedOption] = useState<any[]>([]);
  const userRef = React.createRef<HTMLDivElement>();
  /*const featureFlags = useSelector(selectFeatureFlags);*/
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
    error,
    fetchAllRoles,
    fetchCurrentWorkspace,
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

  const userWorkspacePermissions = currentWorkspace?.userPermissions ?? [];
  const canManage = isPermitted(
    userWorkspacePermissions,
    PERMISSION_TYPE.MANAGE_WORKSPACE,
  );
  /*const isEEFeature = (featureFlags.RBAC && !isAclFlow) || false;*/
  const isEEFeature = false; /* Temp change */

  useEffect(() => {
    if (!isAclFlow) {
      fetchUser(props.workspaceId);
      fetchAllRoles(props.workspaceId);
      fetchCurrentWorkspace(props.workspaceId);
    }
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
            value: role.name,
            label: role.description,
          };
        });

  if (isEEFeature) {
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
      let error = "";
      values.forEach((user: any) => {
        if (!isEmail(user) && !isUserGroup(user)) {
          error = createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST);
        }
      });
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
          title="ABAC based control is here!"
          type="Notify"
        />
      )}
      <StyledForm
        onSubmit={handleSubmit((values: any, dispatch: any) => {
          validateFormValues(values);
          AnalyticsUtil.logEvent("INVITE_USER", values);
          const usersAsStringsArray = values.users.split(",");
          // update state to show success message correctly
          updateNumberOfUsersInvited(usersAsStringsArray.length);
          const users = usersAsStringsArray
            .filter((user: any) => isEmail(user))
            .join(",");
          const groupNames = usersAsStringsArray.filter(
            (user: any) => !isEmail(user),
          );
          const groups = groupNames
            .map((group: string) => getUserGroupId(group))
            .join(",");
          if (onSubmitHandler) {
            return onSubmitHandler({
              ...(isEEFeature ? groups : {}),
              ...(props.workspaceId ? { workspaceId: props.workspaceId } : {}),
              users,
              permissionGroupId: isMultiSelectDropdown
                ? selectedOption.map((group: any) => group.id).join(",")
                : selectedOption[0].id,
            });
          }
          return inviteUsersToWorkspace(
            {
              ...(isEEFeature ? groups : {}),
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
              placeholder={placeholder || "Enter email address"}
              suggestionLeftIcon={
                <Icon
                  className="user-icons"
                  name="group-line"
                  size={IconSize.XXL}
                />
              }
              suggestions={isEEFeature ? listOfUGs : undefined}
              type="text"
            />
            <SelectField
              allowDeselection={isMultiSelectDropdown}
              data-cy="t--invite-role-input"
              disabled={props.disableDropdown}
              isMultiSelect={isMultiSelectDropdown}
              labelRenderer={(selected: Partial<DropdownOption>[]) =>
                getLabel(selected)
              }
              name={"role"}
              onSelect={(value, option) => onSelect(value, option)}
              options={styledRoles}
              outline={false}
              placeholder="Select a role"
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
              <UserList
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
                            <Text type={TextType.P1}>
                              {user.permissionGroupName}
                            </Text>
                          </UserRole>
                        </User>

                        <RoleDivider />
                      </Fragment>
                    );
                  },
                )}
                <ScrollIndicator containerRef={userRef} mode="DARK" />
              </UserList>
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

const InviteUsersForm = cloudHosting
  ? CE_WorkspaceInviteUsersForm
  : connect(
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
        }
      >({
        validate,
      })(WorkspaceInviteUsersForm),
    );

export default InviteUsersForm;
