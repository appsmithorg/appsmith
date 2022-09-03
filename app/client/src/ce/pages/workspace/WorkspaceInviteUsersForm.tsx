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
import { AppState } from "@appsmith/reducers";
import {
  getRolesForField,
  getAllUsers,
  getCurrentAppWorkspace,
} from "@appsmith/selectors/workspaceSelectors";
import Spinner from "components/editorComponents/Spinner";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  InviteUsersToWorkspaceFormValues,
  inviteUsersToWorkspace,
} from "@appsmith/pages/workspace/helpers";
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
import { getAppsmithConfigs } from "@appsmith/configs";
import { ReactComponent as NoEmailConfigImage } from "assets/images/email-not-configured.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Button,
  Size,
  Text,
  TextType,
  Icon,
  IconSize,
  SegmentHeader,
  TextProps,
  TooltipComponent,
  DropdownOption,
} from "design-system";
import { Classes, Variant } from "components/ads/common";
import Callout from "components/ads/Callout";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import ProfileImage from "pages/common/ProfileImage";
import ManageUsers from "pages/workspace/ManageUsers";
import { ScrollIndicator } from "design-system";
import UserApi from "@appsmith/api/UserApi";
import { Colors } from "constants/Colors";
import { fetchWorkspace } from "actions/workspaceActions";
import { SubTextPosition } from "components/constants";
import { Link } from "react-router-dom";
import { Tooltip } from "@blueprintjs/core";
import { isEllipsisActive } from "utils/helpers";

export const CommonTitleTextStyle = css`
  color: ${Colors.CHARCOAL};
  font-weight: normal;
`;

export const WorkspaceInviteWrapper = styled.div`
  > div {
    margin-top: 0;
  }
`;

export const WorkspaceInviteTitle = styled.div`
  padding: 0 0 10px 0;
  & > span[type="h5"] {
    ${CommonTitleTextStyle}
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
  color: ${Colors.GREY_8};
  margin-bottom: 8px;
  line-height: 1.57;
  letter-spacing: -0.24px;
`;

/*const LinksWrapper = styled.div`
  &:before {
    border-top: 1px solid var(--appsmith-color-black-200);
    content: "";
    position: absolute;
    left: 12px;
    right: 12px;
  }
`;*/

export const LeftIconWrapper = styled.span`
  font-size: 20px;
  line-height: 19px;
  margin-right: 10px;
  height: 100%;
  position: relative;
  top: 1px;
`;

export const SelectedIcon = styled(Icon)<{ name: string }>`
  margin-right: 6px;
  & > div:first-child {
    height: 18px;
    width: 18px;
    svg {
      height: 18px;
      width: 18px;
      rect {
        fill: ${(props) => props.theme.colors.dropdownIconBg};
        rx: 0;
      }
      path {
        fill: ${(props) => props.theme.colors.propertyPane.label};
      }
    }
  }
  svg {
    ${(props) =>
      props.name === "right-arrow" ? `transform: rotate(-45deg);` : ``}
    path {
      fill: ${(props) =>
        props.fillColor
          ? props.fillColor
          : props.theme.colors.dropdown.selected.icon};
    }
  }
`;

export const StyledSubText = styled(Text)<{
  showDropIcon?: boolean;
  subTextPosition?: SubTextPosition;
}>`
  ${(props) =>
    props.subTextPosition === SubTextPosition.BOTTOM
      ? "margin-top: 3px"
      : "margin-left: auto"};
  &&& {
    color: ${(props) => props.theme.colors.dropdown.menu.subText};
  }
  &.sub-text {
    color: ${(props) => props.theme.colors.dropdown.selected.subtext};
    text-align: end;
    margin-right: ${(props) => `${props.theme.spaces[4]}px`};
  }
`;

export const OptionWrapper = styled.div<{
  disabled?: boolean;
  selected: boolean;
  subTextPosition?: SubTextPosition;
  selectedHighlightBg?: string;
}>`
  padding: ${(props) => props.theme.spaces[3] + 1}px
    ${(props) => props.theme.spaces[5]}px;
  ${(props) => (!props.disabled ? "cursor: pointer" : "")};
  display: flex;
  width: 100%;
  min-height: 36px;
  flex-direction: ${(props) =>
    props.subTextPosition === SubTextPosition.BOTTOM ? "column" : "row"};
  align-items: ${(props) =>
    props.subTextPosition === SubTextPosition.BOTTOM ? "flex-start" : "center"};
  background-color: ${(props) =>
    props.selected
      ? props.selectedHighlightBg || `var(--appsmith-color-black-200)`
      : `initial`};
  &&& svg {
    rect {
      fill: ${(props) => props.theme.colors.dropdownIconBg};
    }
  }
  .bp3-popover-wrapper {
    width: 100%;
  }
  .${Classes.TEXT} {
    color: ${(props) =>
      props.disabled
        ? Colors.GRAY2
        : props.selected
        ? props.theme.colors.dropdown.menu.hoverText
        : props.theme.colors.dropdown.menu.text};
  }
  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;
    svg {
      path {
        ${(props) =>
          props.selected
            ? `fill: ${props.theme.colors.dropdown.selected.icon}`
            : `fill: ${props.theme.colors.dropdown.icon}`};
      }
    }
  }
  &:hover {
    background-color: ${(props) => props.selectedHighlightBg || `initial`};
    &&& svg {
      rect {
        fill: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.dropdown.menu.hoverText};
    }
    ${StyledSubText} {
      color: ${(props) => props.theme.colors.dropdown.menu.subText};
    }
    .${Classes.ICON} {
      svg {
        path {
          fill: ${(props) => props.theme.colors.dropdown.hovered.icon};
        }
      }
    }
  }
`;

export const StyledText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LabelWrapper = styled.div<{ label?: string }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  span:last-child {
    margin-top: ${(props) => props.theme.spaces[2] - 1}px;
  }
  &:hover {
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.dropdown.selected.text};
    }
  }
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
          _error: createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST),
        });
      }
    });
  } else {
    throw new SubmissionError({
      _error: createMessage(INVITE_USERS_VALIDATION_EMAILS_EMPTY),
    });
  }

  if (
    typeof values.roles === "undefined" &&
    (typeof values.role === "undefined" || values.role?.trim().length === 0)
  ) {
    throw new SubmissionError({
      _error: createMessage(INVITE_USERS_VALIDATION_ROLE_EMPTY),
    });
  }

  if (
    typeof values.role === "undefined" &&
    (typeof values.roles === "undefined" || values.roles.length === 0)
  ) {
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

  if (
    typeof values.roles === "undefined" &&
    (typeof values.role === "undefined" || values.role?.trim().length === 0)
  ) {
    errors["role"] = createMessage(INVITE_USERS_VALIDATION_ROLE_EMPTY);
  }

  if (
    typeof values.role === "undefined" &&
    (typeof values.roles === "undefined" || values.roles.length === 0)
  ) {
    errors["roles"] = createMessage(INVITE_USERS_VALIDATION_ROLE_EMPTY);
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

export const { mailEnabled } = getAppsmithConfigs();

export const InviteButtonWidth = "88px";

function WorkspaceInviteUsersForm(props: any) {
  const [emailError, setEmailError] = useState("");
  const [selectedOption, setSelectedOption] = useState<any>({});
  const userRef = React.createRef<HTMLDivElement>();
  const selectedId = props?.selected?.id;
  const multiSelectDropdownOptions: Partial<DropdownOption>[] =
    props.options && props.options.length > 0 && props.isMultiSelectDropdown
      ? props.options
      : [];

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
    isAclFlow = false,
    isApplicationInvite,
    isLoading,
    isMultiSelectDropdown = false,
    links = [],
    message = "",
    placeholder = "",
    submitFailed,
    submitSucceeded,
    submitting,
    valid,
  } = props;

  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // set state for checking number of users invited
  const [numberOfUsersInvited, updateNumberOfUsersInvited] = useState(0);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);

  const userWorkspacePermissions = currentWorkspace?.userPermissions ?? [];
  const canManage = isPermitted(
    userWorkspacePermissions,
    PERMISSION_TYPE.MANAGE_WORKSPACE,
  );

  useEffect(() => {
    if (!isAclFlow) {
      fetchUser(props.workspaceId);
      fetchAllRoles(props.workspaceId);
      fetchCurrentWorkspace(props.workspaceId);
    }
  }, [props.workspaceId, fetchUser, fetchAllRoles, fetchCurrentWorkspace]);

  useEffect(() => {
    if (selected) {
      setSelectedItems([selected]);
      props.initialize({
        roles: [selected],
      });
    }
  }, []);

  const styledRoles = props.roles.map((role: any) => {
    return {
      id: role.id,
      value: role.name,
      label: role.description,
    };
  });

  styledRoles.push(...links);

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

  const onSelect = (_value?: string, options?: any) => {
    setSelectedItems(options);
  };

  const onRemoveOptions = (updatedItems: any) => {
    setSelectedItems(updatedItems);
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
        if (!isEmail(user)) {
          error = createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST);
        }
      });
      setEmailError(error);
    } else {
      props.customError?.("");
    }
  };

  const renderOption = ({
    index,
    option,
    optionClickHandler,
  }: {
    index?: number;
    option: DropdownOption | DropdownOption[];
    optionClickHandler?: (dropdownOption: DropdownOption) => void;
  }) => {
    let isSelected = false;
    if (props.isMultiSelect && Array.isArray(selected) && selected.length) {
      isSelected = !!selected.find((selectedOption: any) =>
        !Array.isArray(option) ? selectedOption.value === option.value : false,
      );
    } else {
      isSelected =
        !Array.isArray(option) && selected
          ? selected.value === option.value
          : false;
    }
    return !Array.isArray(option) && !option.isSectionHeader ? (
      !option.link ? (
        <TooltipComponent
          content={
            !!option.disabledTooltipText
              ? option.disabledTooltipText
              : "Action not supported"
          }
          disabled={!option.disabled}
          key={`tootltip-${index}`}
          styles={{
            width: "100%",
          }}
        >
          <OptionWrapper
            aria-selected={isSelected}
            className={`t--dropdown-option ${isSelected ? "selected" : ""}`}
            data-cy={`t--dropdown-option-${option?.label}`}
            disabled={option.disabled}
            key={index}
            onClick={
              // users should be able to unselect a selected option by clicking the option again.
              isSelected && props.allowDeselection
                ? () => props.removeSelectedOptionClickHandler(option)
                : () => optionClickHandler?.(option)
            }
            role="option"
            selected={
              props.isMultiSelect ? props.highlightIndex === index : isSelected
            }
            selectedHighlightBg={props.selectedHighlightBg}
            subTextPosition={option.subTextPosition ?? SubTextPosition.LEFT}
          >
            {option.leftElement && (
              <LeftIconWrapper>{option.leftElement}</LeftIconWrapper>
            )}
            {option.icon ? (
              <SelectedIcon
                fillColor={option?.iconColor}
                hoverFillColor={option?.iconColor}
                name={option.icon}
                size={option.iconSize || IconSize.XL}
              />
            ) : null}
            {props.showLabelOnly ? (
              props.truncateOption ? (
                <>
                  <TooltipWrappedText
                    label={option.label || ""}
                    type={TextType.P1}
                  />
                  {option.hasCustomBadge && props.customBadge}
                </>
              ) : (
                <>
                  <Text type={TextType.P1}>{option.label}</Text>
                  {option.hasCustomBadge && props.customBadge}
                </>
              )
            ) : option.label && option.value ? (
              <LabelWrapper className="label-container">
                <Text type={TextType.H5}>{option.value}</Text>
                <Text type={TextType.P1}>{option.label}</Text>
              </LabelWrapper>
            ) : props.truncateOption ? (
              <TooltipWrappedText
                label={option.value || ""}
                type={TextType.P1}
              />
            ) : (
              <Text type={TextType.P1}>{option.value}</Text>
            )}
            {option.subText ? (
              <StyledSubText
                subTextPosition={option.subTextPosition}
                type={TextType.P3}
              >
                {option.subText}
              </StyledSubText>
            ) : null}
          </OptionWrapper>
        </TooltipComponent>
      ) : (
        <Link key={index} to={option.link || "/"}>
          <OptionWrapper
            className={`t--dropdown-link`}
            data-cy={`t--dropdown-option-${option?.value}`}
            disabled={option.disabled}
            role="option"
            selected={false}
            selectedHighlightBg={props.selectedHighlightBg}
            subTextPosition={option.subTextPosition ?? SubTextPosition.LEFT}
          >
            {option.leftElement && (
              <LeftIconWrapper>{option.leftElement}</LeftIconWrapper>
            )}
            {option.icon ? (
              <SelectedIcon
                fillColor={option?.iconColor}
                hoverFillColor={option?.iconColor}
                name={option.icon}
                size={option.iconSize || IconSize.XL}
              />
            ) : null}
            <Text type={TextType.P1}>{option.value}</Text>
            {option.subText ? (
              <StyledSubText
                subTextPosition={option.subTextPosition}
                type={TextType.P3}
              >
                {option.subText}
              </StyledSubText>
            ) : null}
          </OptionWrapper>
        </Link>
      )
    ) : (
      <SegmentHeader
        key={index}
        style={{ paddingRight: theme.spaces[5] }}
        title={!Array.isArray(option) && option.label ? option.label : ""}
      />
    );
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
          return inviteUsersToWorkspace(
            {
              ...values,
              users,
              permissionGroupId: selectedOption.id,
              workspaceId: props.workspaceId,
            },
            dispatch,
          );
        })}
      >
        <LabelText type={TextType.P0}>{message}</LabelText>
        <StyledInviteFieldGroup>
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
              type="text"
            />
            {isMultiSelectDropdown ? (
              <SelectField
                allowDeselection
                disabled={!!selected}
                isMultiSelect
                labelRenderer={(selected: Partial<DropdownOption>[]) =>
                  getLabel(selected)
                }
                name="roles"
                onSelect={onSelect}
                options={multiSelectDropdownOptions}
                outline={false}
                placeholder="Select a role"
                removeSelectedOption={onRemoveOptions}
                selected={selectedItems}
                showLabelOnly
                size="small"
              />
            ) : (
              <SelectField
                data-cy="t--invite-role-input"
                name="role"
                onSelect={(value, option) => setSelectedOption(option)}
                options={styledRoles}
                outline={false}
                placeholder="Select a role"
                renderOption={renderOption}
                size="small"
              />
            )}
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
      links?: any[];
    }
  >({
    validate,
  })(WorkspaceInviteUsersForm),
);
