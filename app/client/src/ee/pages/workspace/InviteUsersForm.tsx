export * from "ce/pages/workspace/InviteUsersForm";

import {
  CustomRolesRamp,
  ErrorBox,
  ErrorTextContainer,
  OptionLabel,
  StyledCheckbox,
  StyledForm,
  StyledInviteFieldGroup,
  WorkspaceText,
  mapStateToProps as CE_mapStateToProps,
  mapDispatchToProps as CE_mapDispatchToProps,
} from "ce/pages/workspace/InviteUsersForm";
import React, { useEffect, useState, useMemo, useRef } from "react";
import styled from "styled-components";
import { reduxForm, SubmissionError } from "redux-form";
import { connect, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  getRolesForField,
  getGroupSuggestions,
} from "@appsmith/selectors/workspaceSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type {
  InviteUsersToWorkspaceFormValues,
  InviteUsersProps,
} from "@appsmith/pages/workspace/helpers";
import { inviteUsersToWorkspace } from "@appsmith/pages/workspace/helpers";
import {
  createMessage,
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USER_SUBMIT_SUCCESS,
  INVITE_USERS_VALIDATION_EMAILS_EMPTY,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
  INVITE_USERS_VALIDATION_ROLE_EMPTY,
  USERS_HAVE_ACCESS_TO_ALL_APPS,
  USERS_HAVE_ACCESS_TO_ONLY_THIS_APP,
  BUSINESS_EDITION_TEXT,
  INVITE_USER_RAMP_TEXT,
} from "@appsmith/constants/messages";
import { isEmail } from "utils/formhelpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useHistory } from "react-router-dom";
import store from "store";
import TagListField from "../../utils/TagInput";
import { getCurrentUser } from "selectors/usersSelectors";
import { getAppRolesForField } from "@appsmith/selectors/applicationSelectors";
import {
  fetchRolesForApplication,
  fetchUsersForApplication,
} from "@appsmith/actions/applicationActions";
import {
  Button,
  Callout,
  Icon,
  Link,
  Option,
  Select,
  Text,
  toast,
} from "design-system";
import {
  getRampLink,
  showProductRamps,
} from "@appsmith/selectors/rampSelectors";
import {
  RAMP_NAME,
  RampFeature,
  RampSection,
} from "utils/ProductRamps/RampsControlList";
import { isGACEnabled } from "@appsmith/utils/planHelpers";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { getShowAdminSettings } from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import type { DefaultOptionType } from "rc-select/lib/Select";
import type { GroupSuggestions } from "@appsmith/reducers/uiReducers/workspaceReducer";

const featureFlags = selectFeatureFlags(store.getState());
const isFeatureEnabled = isGACEnabled(featureFlags);

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
            INVITE_USERS_VALIDATION_EMAIL_LIST,
            !isFeatureEnabled || isAclFlow,
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
          !isFeatureEnabled,
        );
      }
    });
  }
  return errors;
};

const isUserGroup = (user: string) => {
  return getGroupSuggestions(store.getState())?.some(
    (ug: GroupSuggestions) => ug.id === user,
  );
};

const StyledInviteFieldGroupEE = styled(StyledInviteFieldGroup)`
  .user-icons {
    margin-right: 8px;
  }
`;

function InviteUserText({
  isApplicationPage,
  isFeatureEnabled,
  showAppLevelInviteModal,
}: {
  isApplicationPage: boolean;
  isFeatureEnabled: boolean;
  showAppLevelInviteModal: boolean;
}) {
  let content: JSX.Element;

  const showRampSelector = showProductRamps(
    RAMP_NAME.INVITE_USER_TO_APP,
    !isFeatureEnabled,
  );
  const canShowRamp = useSelector(showRampSelector);

  const rampLinkSelector = getRampLink({
    section: RampSection.AppShare,
    feature: RampFeature.Gac,
  });
  const rampLink = useSelector(rampLinkSelector);

  if (showAppLevelInviteModal) {
    content = <>{createMessage(USERS_HAVE_ACCESS_TO_ONLY_THIS_APP)}</>;
  } else {
    content = <>{createMessage(USERS_HAVE_ACCESS_TO_ALL_APPS)}</>;
  }

  if (!isFeatureEnabled && canShowRamp) {
    if (isApplicationPage) {
      content = (
        <>
          {createMessage(INVITE_USER_RAMP_TEXT)}
          <Link kind="primary" target="_blank" to={rampLink}>
            {createMessage(BUSINESS_EDITION_TEXT)}
          </Link>
        </>
      );
    }
  }
  return (
    <Text
      color="var(--ads-v2-color-fg)"
      data-testid="helper-message"
      kind="action-m"
    >
      {content}
    </Text>
  );
}

function InviteUsersForm(props: any) {
  const [emailError, setEmailError] = useState("");
  const [selectedOption, setSelectedOption] = useState<DefaultOptionType[]>([]);
  const user = useSelector(getCurrentUser);
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
    anyTouched,
    customProps = {},
    error,
    fetchAllAppRoles,
    fetchAllAppUsers,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchGroupSuggestions,
    fetchUsers,
    handleSubmit,
    isApplicationPage = false,
    isMultiSelectDropdown = false,
    placeholder = "",
    submitFailed,
    submitSucceeded,
    submitting,
    valid,
  } = props;

  const {
    disableDropdown = false,
    dropdownPlaceholder = "",
    isAclFlow = false,
    onSubmitHandler,
  } = customProps;

  // set state for checking number of users invited
  const [numberOfUsersInvited, updateNumberOfUsersInvited] = useState(0);
  const groupSuggestions: GroupSuggestions[] = useSelector(getGroupSuggestions);

  const invitedEmails = useRef<undefined | string[]>();

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const isEEFeature = (!isAclFlow && isFeatureEnabled) || false;
  const showAppLevelInviteModal =
    (isFeatureEnabled && isApplicationPage) || false;

  useEffect(() => {
    setSelectedOption([]);
  }, [submitSucceeded]);

  useEffect(() => {
    if (!isAclFlow) {
      if (showAppLevelInviteModal) {
        fetchAllAppUsers(props.applicationId);
        fetchAllAppRoles(props.applicationId);
      } else {
        fetchUsers(props.workspaceId);
        fetchAllRoles(props.workspaceId);
      }
      fetchCurrentWorkspace(props.workspaceId);
      if (isFeatureEnabled) {
        fetchGroupSuggestions();
      }
    }
  }, [
    props.workspaceId,
    fetchUsers,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchGroupSuggestions,
    fetchAllAppRoles,
    fetchAllAppUsers,
    props.applicationId,
    showAppLevelInviteModal,
    isAclFlow,
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
          ? createMessage(
              INVITE_USERS_SUBMIT_SUCCESS,
              isAclFlow || !isFeatureEnabled,
            )
          : createMessage(
              INVITE_USER_SUBMIT_SUCCESS,
              isAclFlow || !isFeatureEnabled,
            ),
        { kind: "success" },
      );
      props?.checkIfInvitedUsersFromDifferentDomain?.(invitedEmails.current);
    }
  }, [submitSucceeded, invitedEmails.current]);

  const styledRoles =
    props.options && isAclFlow
      ? props.options.length > 0
        ? props.options
        : []
      : props.roles.map((role: any) => {
          return {
            key: showAppLevelInviteModal ? role.name?.split(" - ")[0] : role.id,
            value: role.name?.split(" - ")[0],
            description: role.description,
          };
        });

  if (isEEFeature && getShowAdminSettings(isFeatureEnabled, user)) {
    styledRoles.push({
      key: "custom-pg",
      value: "Assign Custom Role",
      link: "/settings/groups",
      icon: "right-arrow",
    });
  }

  const onSelect = (value: string, option: DefaultOptionType) => {
    if (option.value === "custom-pg") {
      history.push("/settings/groups");
    }
    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) => [...selectedOptions, option]);
    } else {
      setSelectedOption([option]);
    }
  };

  const onRemoveOptions = (value: string, option: DefaultOptionType) => {
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
        error = createMessage(
          INVITE_USERS_VALIDATION_EMAIL_LIST,
          !isFeatureEnabled || isAclFlow,
        );
      }
      setEmailError(error);
    } else {
      props.customError?.("");
    }
  };

  return (
    <StyledForm
      onSubmit={handleSubmit((values: any, dispatch: any) => {
        const roles = isMultiSelectDropdown
          ? selectedOption
              .map((option: DefaultOptionType) => option.value)
              .join(",")
          : selectedOption[0].value;
        validateFormValues({ ...values, role: roles }, isAclFlow);
        const usersAsStringsArray = values.users.split(",");
        // update state to show success message correctly
        updateNumberOfUsersInvited(usersAsStringsArray.length);
        const usersArray = usersAsStringsArray.filter((user: string) =>
          isEmail(user),
        );
        invitedEmails.current = usersArray;
        const groupsArray = usersAsStringsArray.filter(
          (user: string) => !isEmail(user),
        );
        const usersStr = [...new Set(usersArray)].join(",");
        const groupsStr = [...new Set(groupsArray)].join(",");
        const groupsData = [];
        for (const gId of groupsArray) {
          const data = groupSuggestions.find((g) => g.id === gId);
          data && groupsData.push(data);
        }
        AnalyticsUtil.logEvent("INVITE_USER", {
          ...(isEEFeature
            ? {
                groups: groupsData.map((grp: GroupSuggestions) => grp.id),
                numberOfGroupsInvited: groupsArray.length,
              }
            : {}),
          ...(!isFeatureEnabled ? { users: usersStr } : {}),
          ...(showAppLevelInviteModal ? { appId: props.applicationId } : {}),
          numberOfUsersInvited: usersArray.length,
          role: roles,
          orgId: props.workspaceId,
        });
        if (onSubmitHandler) {
          return onSubmitHandler({
            ...(props.workspaceId ? { workspaceId: props.workspaceId } : {}),
            users: usersStr,
            options: isMultiSelectDropdown ? selectedOption : selectedOption[0],
          });
        }
        return inviteUsersToWorkspace(
          {
            ...(isEEFeature ? { groups: groupsStr } : {}),
            ...(props.workspaceId ? { workspaceId: props.workspaceId } : {}),
            users: usersStr,
            permissionGroupId: roles,
            isApplicationInvite: showAppLevelInviteModal,
            ...(showAppLevelInviteModal
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
            {styledRoles.map((role: DefaultOptionType) => (
              <Option key={role.key} label={role.value} value={role.key}>
                <div className="flex gap-1 items-center">
                  {isMultiSelectDropdown && (
                    <StyledCheckbox
                      isSelected={Boolean(
                        selectedOption.find((v) =>
                          showAppLevelInviteModal
                            ? v.value === role.value
                            : v.key === role.key,
                        ),
                      )}
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                      {role.icon && <Icon name={role.icon} size="md" />}
                      <OptionLabel
                        color="var(--ads-v2-color-fg-emphasis)"
                        kind={role.description && "heading-xs"}
                      >
                        {role.value}
                      </OptionLabel>
                    </div>
                    {role.description && (
                      <Text kind="body-s">{role.description}</Text>
                    )}
                  </div>
                </div>
              </Option>
            ))}
            {!isAclFlow &&
              !isFeatureEnabled &&
              showProductRamps(RAMP_NAME.CUSTOM_ROLES) && (
                <Option disabled>
                  <CustomRolesRamp />
                </Option>
              )}
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

      {!isAclFlow && (
        <div className="flex gap-2 mt-2 items-start">
          <Icon className="mt-1" name="user-3-line" size="md" />
          <WorkspaceText>
            <InviteUserText
              isApplicationPage={isApplicationPage}
              isFeatureEnabled={isFeatureEnabled}
              showAppLevelInviteModal={showAppLevelInviteModal}
            />
          </WorkspaceText>
        </div>
      )}
      <ErrorBox message={submitFailed}>
        {submitFailed && error && <Callout kind="error">{error}</Callout>}
      </ErrorBox>
    </StyledForm>
  );
}

const mapStateToProps = (
  state: AppState,
  {
    formName,
    isApplicationPage,
  }: { formName?: string; isApplicationPage?: boolean },
) => {
  const featureFlags = selectFeatureFlags(state);
  const isFeatureEnabled = isGACEnabled(featureFlags);
  const showAppLevelInviteModal =
    (isFeatureEnabled && isApplicationPage) || false;
  const ceMapStateToProps = CE_mapStateToProps(state, {
    formName,
  });
  return {
    ...ceMapStateToProps,
    roles: showAppLevelInviteModal
      ? getAppRolesForField(state)
      : getRolesForField(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const ceMapDispatchToProps = CE_mapDispatchToProps(dispatch);
  return {
    ...ceMapDispatchToProps,
    fetchGroupSuggestions: () =>
      dispatch({
        type: ReduxActionTypes.FETCH_GROUP_SUGGESTIONS,
      }),
    fetchAllAppRoles: (applicationId: string) =>
      dispatch(fetchRolesForApplication(applicationId)),
    fetchAllAppUsers: (applicationId: string) =>
      dispatch(fetchUsersForApplication(applicationId)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<InviteUsersToWorkspaceFormValues, InviteUsersProps>({
    validate,
  })(InviteUsersForm),
);
