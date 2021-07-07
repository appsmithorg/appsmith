import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import { AppState } from "reducers";
import { BASE_URL } from "constants/routes";
import { Colors } from "constants/Colors";
import AppsmithLogo from "assets/images/appsmith_logo_white.png";

const StyledPageHeader = styled(StyledHeader)`
  width: 100%;
  height: 48px;
  background: ${Colors.BALTIC_SEA};
  display: flex;
  justify-content: center;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
  padding: 0px ${(props) => props.theme.spaces[12]};
`;

const LogoContainer = styled.div`
  .logoimg {
    max-width: 110px;
  }
`;

export function LoginHeader() {
  return (
    <StyledPageHeader>
      <LogoContainer>
        <Link to={BASE_URL}>
          <img
            alt="Appsmith Logo"
            className="logoimg t--Appsmith-logo-image"
            src={AppsmithLogo}
          />
        </Link>
      </LogoContainer>
    </StyledPageHeader>
  );
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
});

export default connect(mapStateToProps)(LoginHeader);
