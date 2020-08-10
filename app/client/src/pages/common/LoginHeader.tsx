import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import { AppState } from "reducers";
import Logo from "assets/images/appsmith_logo.png";
import { BASE_URL } from "constants/routes";

const StyledPageHeader = styled(StyledHeader)`
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[4]}px;
`;

const LogoContainer = styled.div`
  .logoimg {
    width: 15%;
  }
`;

export const LoginHeader = () => {
  return (
    <StyledPageHeader>
      <LogoContainer>
        <Link to={BASE_URL}>
          <img className="logoimg" src={Logo} alt="Appsmith Logo" />
        </Link>
      </LogoContainer>
    </StyledPageHeader>
  );
};

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
});

export default connect(mapStateToProps)(LoginHeader);
