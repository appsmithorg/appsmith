import React, { useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import {
  FieldArray,
  reduxForm,
  InjectedFormProps,
  WrappedFieldArrayProps,
} from "redux-form";
import FormMessage from "components/editorComponents/form/FormMessage";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";
import {
  INVITE_USERS_VALIDATION_EMAIL_LIST,
  INVITE_USERS_VALIDATION_ROLE_EMPTY,
  INVITE_USERS_EMAIL_LIST_LABEL,
  INVITE_USERS_EMAIL_LIST_PLACEHOLDER,
  INVITE_USERS_ROLE_SELECT_LABEL,
  INVITE_USERS_ROLE_SELECT_PLACEHOLDER,
  INVITE_USERS_ADD_EMAIL_LIST_FIELD,
  INVITE_USERS_SUBMIT_BUTTON_TEXT,
  INVITE_USERS_SUBMIT_ERROR,
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USERS_VALIDATION_EMAILS_EMPTY,
} from "constants/messages";
import {
  InviteUsersToOrgFormValues,
  InviteUsersToOrgByRoleValues,
  inviteUsersToOrgSubmitHandler,
} from "./helpers";
import { generateReactKey } from "utils/generators";
import TagListField from "components/editorComponents/form/fields/TagListField";
import { FormIcons } from "icons/FormIcons";
import FormFooter from "components/editorComponents/form/FormFooter";
import FormActionButton from "components/editorComponents/form/FormActionButton";
import FormGroup from "components/editorComponents/form/FormGroup";
import SelectField from "components/editorComponents/form/fields/SelectField";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import { getRoles, getDefaultRole } from "selectors/organizationSelectors";
import { OrgRole } from "constants/orgConstants";
import { isEmail } from "utils/formhelpers";

const validate = (values: InviteUsersToOrgFormValues) => {
  const errors: any = { usersByRole: [] };
  if (values.usersByRole && values.usersByRole.length) {
    values.usersByRole.forEach((role, index) => {
      errors.usersByRole[index] = { id: "", users: "", role: "" };
      // If we have users entered for a role.
      if (role.users && role.users.length > 0) {
        // Split the users CSV string to an array.
        const _users = role.users.split(",").filter(Boolean);
        // Check if each entry is an email
        _users.forEach(user => {
          if (!isEmail(user)) {
            if (errors.usersByRole[index].users)
              errors.usersByRole[index].users += `${user}, `;
            else errors.usersByRole[index].users = `${user}, `;
          }
        });
        if (
          errors.usersByRole[index].users &&
          errors.usersByRole[index].users.length > 0
        ) {
          errors.usersByRole[
            index
          ].users = `${INVITE_USERS_VALIDATION_EMAIL_LIST} ${errors.usersByRole[
            index
          ].users.slice(0, -2)}`;
        }
        // Check if role has been specified
        if (role.role === undefined || role.role?.trim().length === 0) {
          errors.usersByRole[index].role = INVITE_USERS_VALIDATION_ROLE_EMPTY;
        }
      } else {
        errors.usersByRole[index].users = INVITE_USERS_VALIDATION_EMAILS_EMPTY;
      }
    });
  }
  return errors;
};

const StyledForm = styled.div`
  width: 100%;
  background: white;
  padding: ${props => props.theme.spaces[11]}px;
`;

const StyledInviteFieldGroup = styled.div`
  && {
    display: flex;
    flex-direction: row;
    flex-wrap: none;
    justify-content: space-between;
    align-items: flex-start;
    & > div:first-of-type {
    }
    & > div {
      min-width: 150px;
      margin: 0em 1em 1em 0em;
    }
    & > div:last-of-type {
      min-width: 0;
      display: flex;
      align-self: center;
    }
  }
`;

const renderInviteUsersByRoleForm = (
  renderer: WrappedFieldArrayProps<InviteUsersToOrgByRoleValues> & {
    roles?: OrgRole[];
    role?: OrgRole;
  },
) => {
  const { fields, roles, role } = renderer;
  return (
    <React.Fragment>
      {fields.map((field, index) => {
        return (
          <StyledInviteFieldGroup key={`${field}.id`}>
            <FormGroup fill label={INVITE_USERS_EMAIL_LIST_LABEL}>
              <TagListField
                name={`${field}.users`}
                placeholder={INVITE_USERS_EMAIL_LIST_PLACEHOLDER}
                type="email"
                label="Emails"
                intent="success"
              />
            </FormGroup>
            {roles && (
              <FormGroup label={INVITE_USERS_ROLE_SELECT_LABEL}>
                <SelectField
                  name={`${field}.role`}
                  placeholder={INVITE_USERS_ROLE_SELECT_PLACEHOLDER}
                  options={roles}
                  size="large"
                />
              </FormGroup>
            )}
            <FormIcons.DELETE_ICON
              width={32}
              height={32}
              style={{
                cursor: "pointer",
              }}
              onClick={() => fields.remove(index)}
            />
          </StyledInviteFieldGroup>
        );
      })}
      <FormActionButton
        onClick={() =>
          fields.push({
            id: generateReactKey(),
            role: !!role ? role.id : undefined,
          })
        }
        text={INVITE_USERS_ADD_EMAIL_LIST_FIELD}
        icon="plus"
      />
    </React.Fragment>
  );
};

type InviteUsersFormProps = InjectedFormProps<
  InviteUsersToOrgFormValues,
  {
    fetchRoles: () => void;
    roles?: OrgRole[];
    defaultRole?: OrgRole;
  }
> & {
  fetchRoles: () => void;
  roles?: OrgRole[];
  defaultRole?: OrgRole;
};

export const InviteUsersForm = (props: InviteUsersFormProps) => {
  const {
    handleSubmit,
    submitting,
    submitFailed,
    submitSucceeded,
    error,
    fetchRoles,
    roles,
    initialize,
    defaultRole,
    anyTouched,
  } = props;
  const history = useHistory();
  useEffect(() => {
    if (!roles) {
      fetchRoles();
    } else {
      initialize({
        usersByRole: [
          {
            id: generateReactKey(),
            role: !!defaultRole ? defaultRole.id : undefined,
          },
        ],
      });
    }
  }, [fetchRoles, roles, defaultRole, initialize]);

  return (
    <StyledForm>
      {submitSucceeded && (
        <FormMessage intent="primary" message={INVITE_USERS_SUBMIT_SUCCESS} />
      )}
      {submitFailed && error && (
        <FormMessage
          intent="danger"
          message={`${INVITE_USERS_SUBMIT_ERROR}: ${error}`}
        />
      )}

      <FieldArray
        name="usersByRole"
        component={renderInviteUsersByRoleForm}
        props={{ roles: roles }}
      />
      <FormFooter
        divider
        onSubmit={handleSubmit(inviteUsersToOrgSubmitHandler)}
        submitting={submitting && !(submitFailed && !anyTouched)}
        onCancel={() => history.goBack()}
        submitOnEnter={false}
        submitText={INVITE_USERS_SUBMIT_BUTTON_TEXT}
      ></FormFooter>
    </StyledForm>
  );
};

export default connect(
  (state: AppState) => {
    return {
      roles: getRoles(state),
      defaultRole: getDefaultRole(state),
    };
  },
  (dispatch: any) => ({
    fetchRoles: () => dispatch({ type: ReduxActionTypes.FETCH_ORG_ROLES_INIT }),
  }),
)(
  reduxForm<
    InviteUsersToOrgFormValues,
    { fetchRoles: () => void; roles?: OrgRole[]; defaultRole?: OrgRole }
  >({
    form: INVITE_USERS_TO_ORG_FORM,
    validate,
  })(InviteUsersForm),
);
