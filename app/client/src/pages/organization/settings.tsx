import React from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { AppState } from "reducers";
import { getCurrentOrg } from "selectors/organizationSelectors";
import { ORG_INVITE_USERS_PAGE_URL } from "constants/routes";
import EditableText from "components/editorComponents/EditableText";
import PageSectionDivider from "pages/common/PageSectionDivider";
import PageSectionHeader from "pages/common/PageSectionHeader";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import Button from "components/editorComponents/Button";
import { Org } from "constants/orgConstants";

export type PageProps = {
  org?: Org;
  changeOrgName: (value: string) => void;
};

export const OrgSettings = (props: PageProps) => {
  const changeOrgName = (value: string) => {
    if (props.org && value.trim().length > 0 && value !== props.org.name) {
      props.changeOrgName(value);
    }
  };

  const history = useHistory();

  return (
    <React.Fragment>
      <PageSectionHeader>
        <h2>
          {props.org && (
            <EditableText
              defaultValue={props.org.name}
              type="text"
              isEditing={false}
              onTextChanged={changeOrgName}
              placeholder="Enter Organization Name"
            />
          )}
        </h2>
      </PageSectionHeader>
      <PageSectionDivider />
      <PageSectionHeader>
        <h2>Users</h2>
        <Button
          intent="primary"
          text="Invite Users"
          icon="plus"
          iconAlignment="left"
          filled
          onClick={() => history.push(ORG_INVITE_USERS_PAGE_URL)}
        />
      </PageSectionHeader>
    </React.Fragment>
  );
};

const mapStateToProps = (state: AppState) => ({
  org: getCurrentOrg(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  changeOrgName: (name: string) =>
    dispatch({
      type: ReduxActionTypes.UPDATE_ORG_NAME_INIT,
      payload: {
        name,
      },
    }),
  deleteOrg: (orgId: string) =>
    dispatch({
      type: ReduxActionTypes.DELETE_ORG_INIT,
      payload: {
        orgId,
      },
    }),
});

export default connect(mapStateToProps, mapDispatchToProps)(OrgSettings);
