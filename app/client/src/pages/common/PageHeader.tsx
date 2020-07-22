import React from "react";
import { useHistory, Link } from "react-router-dom";
import { connect } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import CustomizedDropdown from "./CustomizedDropdown";
import DropdownProps from "./CustomizedDropdown/HeaderDropdownData";
import { AppState } from "reducers";
import { User, ANONYMOUS_USERNAME } from "constants/userConstants";
import Logo from "assets/images/appsmith_logo.png";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { useEffect } from "react";
import { AUTH_LOGIN_URL, APPLICATIONS_URL } from "constants/routes";
import Button from "components/editorComponents/Button";

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
  user?: User;
};

export const PageHeader = (props: PageHeaderProps) => {
  const { user } = props;
  const history = useHistory();

  return (
    <StyledPageHeader>
      <LogoContainer>
        <Link to={APPLICATIONS_URL}>
          <img className="logoimg" src={Logo} alt="Appsmith Logo" />
        </Link>
      </LogoContainer>
      <StyledDropDownContainer>
        {user && user.username !== ANONYMOUS_USERNAME ? (
          <CustomizedDropdown {...DropdownProps(user, user.username)} />
        ) : (
          <Button
            filled
            text="Sign In"
            intent={"primary"}
            size="small"
            onClick={() => history.push(AUTH_LOGIN_URL)}
          />
        )}
      </StyledDropDownContainer>
    </StyledPageHeader>
  );
};

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
});

export default connect(mapStateToProps)(PageHeader);
