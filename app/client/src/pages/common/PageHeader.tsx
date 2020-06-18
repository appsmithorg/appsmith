import React from "react";
import { connect } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { getOrgs, getCurrentOrg } from "selectors/organizationSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import CustomizedDropdown from "./CustomizedDropdown";
import DropdownProps from "./CustomizedDropdown/HeaderDropdownData";
import { AppState } from "reducers";
import { Org } from "constants/orgConstants";
import { User } from "constants/userConstants";
import Logo from "assets/images/appsmith_logo.png";

const StyledPageHeader = styled(StyledHeader)`
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[4]}px;
`;

const StyledDropDownContainer = styled.div``;

const LogoContainer = styled.div`
  .logoimg {
    width: 15%;
  }
`;

type PageHeaderProps = {
  orgs?: Org[];
  currentOrg?: Org;
  user?: User;
};

export const PageHeader = (props: PageHeaderProps) => {
  const { user } = props;
  return (
    <StyledPageHeader>
      <LogoContainer>
        <a href="/applications">
          <img className="logoimg" src={Logo} alt="Appsmith Logo" />
        </a>
      </LogoContainer>
      <StyledDropDownContainer>
        {user && <CustomizedDropdown {...DropdownProps(user, user.username)} />}
      </StyledDropDownContainer>
    </StyledPageHeader>
  );
};

const mapStateToProps = (state: AppState) => ({
  currentOrg: getCurrentOrg(state),
  user: getCurrentUser(state),
  orgs: getOrgs(state),
});

export default connect(mapStateToProps, null)(PageHeader);
