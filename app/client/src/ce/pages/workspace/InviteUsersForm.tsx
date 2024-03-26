import React, { useEffect, useState, useMemo, useRef } from "react";
import styled from "styled-components";
import TagListField from "components/editorComponents/form/fields/TagListField";
import { reduxForm, SubmissionError } from "redux-form";
import { connect, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getRolesForField } from "@appsmith/selectors/workspaceSelectors";
import type {
  InviteUsersToWorkspaceFormValues,
  InviteUsersProps,
} from "@appsmith/pages/workspace/helpers";
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
  BUSINESS_EDITION_TEXT,
  INVITE_USER_RAMP_TEXT,
  CUSTOM_ROLES_RAMP_TEXT,
  CUSTOM_ROLE_DISABLED_OPTION_TEXT,
  CUSTOM_ROLE_TEXT,
} from "@appsmith/constants/messages";
import { isEmail } from "utils/formhelpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { SelectOptionProps } from "design-system";
import { Callout, Checkbox } from "design-system";
import {
  Button,
  Icon,
  Select,
  Text,
  Option,
  Tooltip,
  toast,
  Link,
} from "design-system";
import {
  fetchRolesForWorkspace,
  fetchUsersForWorkspace,
  fetchWorkspace,
} from "@appsmith/actions/workspaceActions";
import {
  getRampLink,
  showProductRamps,
} from "@appsmith/selectors/rampSelectors";
import {
  RAMP_NAME,
  RampFeature,
  RampSection,
} from "utils/ProductRamps/RampsControlList";
import BusinessTag from "components/BusinessTag";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import store from "store";
import { isGACEnabled } from "@appsmith/utils/planHelpers";
import type { DefaultOptionType } from "rc-select/lib/Select";

const featureFlags = selectFeatureFlags(store.getState());
const isFeatureEnabled = isGACEnabled(featureFlags);

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

export const ErrorTextContainer = styled.div`
  display: flex;
  margin-top: 4px;
  gap: 4px;

  > p {
    color: var(--ads-v2-color-fg-error);
  }

  svg {
    path {
      fill: var(--ads-v2-color-fg-error);
    }
  }
`;

export const WorkspaceText = styled.div`
  a {
    display: inline;
  }
`;
export const CustomRoleRampTooltip = styled(Tooltip)`
  pointer-events: auto;
`;
export const RampLink = styled(Link)`
  display: inline;
`;

export const StyledCheckbox = styled(Checkbox)`
  height: 16px;

  .ads-v2-checkbox {
    padding: 0;
  }
`;

export const OptionLabel = styled(Text)`
  overflow: hidden;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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
            !isFeatureEnabled,
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
          !isFeatureEnabled,
        );
      }
    });
  }
  return errors;
};

export function InviteUserText({
  isApplicationPage,
}: {
  isApplicationPage: boolean;
}) {
  const rampLinkSelector = getRampLink({
    section: RampSection.AppShare,
    feature: RampFeature.Gac,
  });
  const rampLink = useSelector(rampLinkSelector);
  const showRampSelector = showProductRamps(RAMP_NAME.INVITE_USER_TO_APP);
  const canShowRamp = useSelector(showRampSelector);
  return (
    <Text
      color="var(--ads-v2-color-fg)"
      data-testid="helper-message"
      kind="action-m"
    >
      {canShowRamp && isApplicationPage ? (
        <>
          {createMessage(INVITE_USER_RAMP_TEXT)}
          <Link kind="primary" target="_blank" to={rampLink}>
            {createMessage(BUSINESS_EDITION_TEXT)}
          </Link>
        </>
      ) : (
        createMessage(USERS_HAVE_ACCESS_TO_ALL_APPS)
      )}
    </Text>
  );
}

export function CustomRolesRamp() {
  const [dynamicProps, setDynamicProps] = useState<any>({});
  const rampLinkSelector = getRampLink({
    section: RampSection.WorkspaceShare,
    feature: RampFeature.Gac,
  });
  const rampLink = useSelector(rampLinkSelector);
  const rampText = (
    <Text color="var(--ads-v2-color-white)" kind="action-m">
      {createMessage(CUSTOM_ROLES_RAMP_TEXT)}{" "}
      <RampLink
        className="inline"
        kind="primary"
        onClick={() => {
          setDynamicProps({ visible: false });
          window.open(rampLink, "_blank");
          // This reset of prop is required because, else the tooltip will be controlled by the state
          setTimeout(() => {
            setDynamicProps({});
          }, 1);
        }}
      >
        {createMessage(BUSINESS_EDITION_TEXT)}
      </RampLink>
    </Text>
  );
  return (
    <CustomRoleRampTooltip
      content={rampText}
      placement="right"
      {...dynamicProps}
    >
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <Text color="var(--ads-v2-color-fg-emphasis)" kind="heading-xs">
            {createMessage(CUSTOM_ROLE_TEXT)}
          </Text>
          <BusinessTag size="md" />
        </div>
        <Text kind="body-s">
          {createMessage(CUSTOM_ROLE_DISABLED_OPTION_TEXT)}
        </Text>
      </div>
    </CustomRoleRampTooltip>
  );
}

function InviteUsersForm(props: any) {
  const [emailError, setEmailError] = useState("");
  const [selectedOption, setSelectedOption] = useState<any[]>([]);
  const selectedId = props?.selected?.id;
  const showRampSelector = showProductRamps(RAMP_NAME.CUSTOM_ROLES);
  const canShowRamp = useSelector(showRampSelector);

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
    anyTouched,
    customProps = {},
    error,
    fetchAllRoles,
    fetchCurrentWorkspace,
    fetchUsers,
    handleSubmit,
    isAclFlow = false,
    isApplicationPage = false,
    isMultiSelectDropdown = false,
    placeholder = "",
    submitFailed,
    submitSucceeded,
    submitting,
    valid,
  } = props;

  const { disableDropdown = false } = customProps;

  // set state for checking number of users invited
  const [numberOfUsersInvited, updateNumberOfUsersInvited] = useState(0);

  const invitedEmails = useRef<undefined | string[]>();

  useEffect(() => {
    setSelectedOption([]);
  }, [submitSucceeded]);

  useEffect(() => {
    fetchCurrentWorkspace(props.workspaceId);
    fetchAllRoles(props.workspaceId);
    fetchUsers(props.workspaceId);
  }, [props.workspaceId, fetchAllRoles, fetchCurrentWorkspace, fetchUsers]);

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

      props?.checkIfInvitedUsersFromDifferentDomain?.(invitedEmails.current);
    }
  }, [submitSucceeded, invitedEmails.current]);

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

  const onSelect = (value: string, option: DefaultOptionType) => {
    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) => [...selectedOptions, option]);
    } else {
      setSelectedOption([option]);
    }
  };

  const errorHandler = (error: string) => {
    setEmailError(error);
  };

  const onRemoveOptions = (value: string, option: DefaultOptionType) => {
    if (isMultiSelectDropdown) {
      setSelectedOption((selectedOptions) =>
        selectedOptions.filter((opt) => opt.value !== option.value),
      );
    }
  };

  return (
    <StyledForm
      onSubmit={handleSubmit(async (values: any, dispatch: any) => {
        const roles = isMultiSelectDropdown
          ? selectedOption
              .map((option: DefaultOptionType) => option.value)
              .join(",")
          : selectedOption[0].value;
        validateFormValues({ ...values, role: roles });
        const usersAsStringsArray = values.users.split(",");
        // update state to show success message correctly
        updateNumberOfUsersInvited(usersAsStringsArray.length);
        const validEmails = usersAsStringsArray.filter((user: string) =>
          isEmail(user),
        );
        const validEmailsString = [...new Set(validEmails)].join(",");
        invitedEmails.current = validEmails;

        AnalyticsUtil.logEvent("INVITE_USER", {
          ...(!isFeatureEnabled ? { users: usersAsStringsArray } : {}),
          role: roles,
          numberOfUsersInvited: usersAsStringsArray.length,
          orgId: props.workspaceId,
        });
        return inviteUsersToWorkspace(
          {
            ...(props.workspaceId ? { workspaceId: props.workspaceId } : {}),
            users: validEmailsString,
            permissionGroupId: roles,
          },
          dispatch,
        );
      })}
    >
      <StyledInviteFieldGroup>
        <div style={{ width: "60%" }}>
          <TagListField
            autofocus
            className="ml-0.5"
            customError={(err: string) => errorHandler(err)}
            data-testid="t--invite-email-input"
            intent="success"
            label="Emails"
            name="users"
            placeholder={placeholder || "Enter email address(es)"}
            type="email"
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
            getPopupContainer={(triggerNode) =>
              triggerNode.parentNode.parentNode
            }
            isDisabled={disableDropdown}
            isMultiSelect={isMultiSelectDropdown}
            listHeight={400}
            onDeselect={onRemoveOptions}
            onSelect={onSelect}
            optionLabelProp="label"
            placeholder="Select a role"
            value={selectedOption}
          >
            {styledRoles.map((role: DefaultOptionType) => (
              <Option key={role.key} label={role.value} value={role.key}>
                <div className="flex gap-1 items-center">
                  {isMultiSelectDropdown && (
                    <StyledCheckbox
                      isSelected={selectedOption.find((v) => v.key == role.key)}
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <OptionLabel
                      color="var(--ads-v2-color-fg-emphasis)"
                      kind={role.description && "heading-xs"}
                    >
                      {role.value}
                    </OptionLabel>
                    {role.description && (
                      <Text kind="body-s">{role.description}</Text>
                    )}
                  </div>
                </div>
              </Option>
            ))}
            {canShowRamp && (
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
      </StyledInviteFieldGroup>
      {!isAclFlow && (
        <div className="flex gap-2 mt-2 items-start">
          <Icon className="mt-1" name="user-3-line" size="md" />
          <WorkspaceText>
            <InviteUserText isApplicationPage={isApplicationPage} />
          </WorkspaceText>
        </div>
      )}
      <ErrorBox message={submitFailed}>
        {submitFailed && error && <Callout kind="error">{error}</Callout>}
      </ErrorBox>
    </StyledForm>
  );
}

export const mapStateToProps = (
  state: AppState,
  { formName }: { formName?: string },
) => {
  return {
    roles: getRolesForField(state),
    form: formName || INVITE_USERS_TO_WORKSPACE_FORM,
  };
};

export const mapDispatchToProps = (dispatch: any) => ({
  fetchAllRoles: (workspaceId: string) =>
    dispatch(fetchRolesForWorkspace(workspaceId)),
  fetchCurrentWorkspace: (workspaceId: string) =>
    dispatch(fetchWorkspace(workspaceId)),
  fetchUsers: (workspaceId: string) =>
    dispatch(fetchUsersForWorkspace(workspaceId)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<InviteUsersToWorkspaceFormValues, InviteUsersProps>({
    validate,
  })(InviteUsersForm),
);
