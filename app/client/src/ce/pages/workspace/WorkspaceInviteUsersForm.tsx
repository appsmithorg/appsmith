import React, {
  Fragment,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import styled, {
  createGlobalStyle,
  css,
  ThemeContext,
} from "styled-components";
import TagListField from "components/editorComponents/form/fields/TagListField";
import { reduxForm, SubmissionError } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import { connect, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  getRolesForField,
  getAllUsers,
  getCurrentAppWorkspace,
} from "@appsmith/selectors/workspaceSelectors";
import Spinner from "components/editorComponents/Spinner";
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
} from "@appsmith/constants/messages";
import { isEmail } from "utils/formhelpers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ReactComponent as NoEmailConfigImage } from "assets/images/email-not-configured.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { DropdownOption, TextProps } from "design-system-old";
import {
  Button,
  Classes,
  Callout,
  Size,
  Text,
  TextType,
  Variant,
  Icon,
  IconSize,
} from "design-system-old";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import ProfileImage from "pages/common/ProfileImage";
import ManageUsers from "pages/workspace/ManageUsers";
import { Colors } from "constants/Colors";
import {
  fetchRolesForWorkspace,
  fetchUsersForWorkspace,
  fetchWorkspace,
} from "@appsmith/actions/workspaceActions";
import { useHistory } from "react-router-dom";
import { Tooltip } from "@blueprintjs/core";
import { isEllipsisActive } from "utils/helpers";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import type { WorkspaceUserRoles } from "@appsmith/constants/workspaceConstants";

const { cloudHosting, mailEnabled } = getAppsmithConfigs();

export const CommonTitleTextStyle = css`
  color: ${Colors.CHARCOAL};
  font-weight: normal;
`;

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

export const User = styled.div`
  display: flex;
  align-items: center;
  min-height: 54px;
  padding: 5px 0 5px 15px;
  justify-content: space-between;
  color: ${(props) => props.theme.colors.modal.user.textColor};
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
  .${Classes.TEXT} {
    color: ${Colors.COD_GRAY};
    display: inline-block;
    width: 100%;
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

    &[type="h5"] {
      color: ${Colors.COD_GRAY};
    }

    &[type="p2"] {
      color: ${Colors.GRAY};
    }
  }
`;

export const RoleDivider = styled.div`
  border-top: 1px solid ${(props) => props.theme.colors.menuBorder};
`;

export const Loading = styled(Spinner)`
  padding-top: 10px;
  margin: auto;
  width: 100%;
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
  && > a {
    color: ${(props) => props.theme.colors.modal.email.desc};
    font-size: 12px;
    text-decoration: underline;
  }
`;

export const LabelText = styled(Text)`
  font-size: 14px;
  color: ${Colors.GREY_7};
  margin: 8px 0;
  line-height: 1.31;
  letter-spacing: -0.24px;
  display: flex;
  font-weight: var(--ads-font-weight-normal);

  .cs-icon {
    margin-right: 8px;
  }
`;

export const StyledText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function TooltipWrappedText(
  props: TextProps & {
    label: string;
  },
) {
  const { label, ...textProps } = props;
  const targetRef = useRef<HTMLDivElement | null>(null);
  return (
    <Tooltip
      boundary="window"
      content={label}
      disabled={!isEllipsisActive(targetRef.current)}
      position="top"
    >
      <StyledText ref={targetRef} {...textProps}>
        {label}
      </StyledText>
    </Tooltip>
  );
}

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

export const InviteButtonWidth = "88px";

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
    disableEmailSetup = false,
    disableManageUsers = false,
    disableUserList = false,
    error,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchUser,
    handleSubmit,
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

  const errorHandler = (error: string) => {
    setEmailError(error);
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
            <SelectField
              allowDeselection={isMultiSelectDropdown}
              data-cy="t--invite-role-input"
              disabled={props.disableDropdown}
              dropdownMaxHeight={props.dropdownMaxHeight}
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
        </StyledInviteFieldGroup>
        <LabelText type={TextType.P0}>
          <Icon name="user-3-line" size={IconSize.MEDIUM} />
          {createMessage(USERS_HAVE_ACCESS_TO_ALL_APPS)}
        </LabelText>
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
                    roles: WorkspaceUserRoles[];
                    initials: string;
                    photoId?: string;
                  }) => {
                    return (
                      <Fragment key={user.username}>
                        <User>
                          <UserInfo>
                            <ProfileImage
                              source={
                                user.photoId
                                  ? `/api/${USER_PHOTO_ASSET_URL}/${user.photoId}`
                                  : undefined
                              }
                              userName={user.name || user.username}
                            />
                            <UserName>
                              <Text type={TextType.H5}>{user.name}</Text>
                              <Text type={TextType.P2}>{user.username}</Text>
                            </UserName>
                          </UserInfo>
                          <UserRole>
                            <Text type={TextType.P1}>
                              {user.roles?.[0]?.name?.split(" - ")[0] || ""}
                            </Text>
                          </UserRole>
                        </User>

                        <RoleDivider />
                      </Fragment>
                    );
                  },
                )}
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
