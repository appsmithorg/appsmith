import React from "react";
import { connect } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { getOrgs, getCurrentOrg } from "selectors/organizationSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import CustomizedDropdown from "./CustomizedDropdown";
import DropdownProps from "./CustomizedDropdown/OrgDropdownData";
import { AppState } from "reducers";
import { Org } from "constants/orgConstants";
import { User } from "constants/userConstants";

const StyledPageHeader = styled(StyledHeader)`
  justify-content: space-between;
`;

type PageHeaderProps = {
  orgs?: Org[];
  currentOrg?: Org;
  user?: User;
};

export const PageHeader = (props: PageHeaderProps) => {
  const { orgs, currentOrg, user } = props;
  return (
    <StyledPageHeader>
      {orgs && user && currentOrg && (
        <CustomizedDropdown {...DropdownProps(orgs, currentOrg, user)} />
      )}
    </StyledPageHeader>
  );
};

const mapStateToProps = (state: AppState) => ({
  currentOrg: getCurrentOrg(state),
  user: getCurrentUser(state),
  orgs: getOrgs(state),
});

export default connect(mapStateToProps, null)(PageHeader);
