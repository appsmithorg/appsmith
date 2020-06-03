import React, { useEffect } from "react";
import styled from "styled-components";
import TagListField from "components/editorComponents/form/fields/TagListField";
import FormGroup from "components/editorComponents/form/FormGroup";
import { reduxForm } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import Button from "components/editorComponents/Button";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getRoles,
  getDefaultRole,
  getRolesForField,
} from "selectors/organizationSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { InviteUsersToOrgFormValues, inviteUsersToOrg } from "./helpers";
import { OrgRole } from "constants/orgConstants";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";

const StyledForm = styled.div`
  width: 100%;
  background: white;
  padding: ${props => props.theme.spaces[11]}px;

  &&& {
    .bp3-input {
      box-shadow: none;
    }
  }
`;
const StyledInviteFieldGroup = styled.div`
  && {
    display: flex;
    flex-direction: row;
    flex-wrap: none;
    justify-content: space-between;
    align-items: flex-start;

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

const InviteUsersForm = (props: any) => {
  const { handleSubmit } = props;
  useEffect(() => {
    props.fetchAllRoles(props.orgId);
  }, [props.orgId]);

  return (
    <StyledForm>
      <StyledInviteFieldGroup>
        <FormGroup fill>
          <TagListField
            name="users"
            placeholder="Enter email address"
            type="email"
            label="Emails"
            intent="success"
          />
        </FormGroup>
        <SelectField
          name={`role`}
          placeholder="Select a role"
          options={props.roles}
          size="large"
        />
        <Button
          text="Invite"
          filled
          intent="primary"
          onClick={handleSubmit((values: any, dispatch: any) => {
            inviteUsersToOrg({ ...values, orgId: props.orgId }, dispatch);
          })}
        />
      </StyledInviteFieldGroup>
    </StyledForm>
  );
};

export default connect(
  (state: AppState) => {
    return {
      roles: getRolesForField(state),
      defaultRole: getDefaultRole(state),
    };
  },
  (dispatch: any) => ({
    fetchAllRoles: (orgId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_ROLES_INIT,
        payload: {
          orgId,
        },
      }),
  }),
)(
  reduxForm<
    InviteUsersToOrgFormValues,
    { fetchAllRoles: (orgId: string) => void; roles?: any }
  >({
    form: INVITE_USERS_TO_ORG_FORM,
  })(InviteUsersForm),
);
