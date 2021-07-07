import React from "react";
import { Link, useLocation } from "react-router-dom";
import { connect, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import AppsmithLogo from "assets/images/appsmith_logo_white.png";
import { AppState } from "reducers";
import { User, ANONYMOUS_USERNAME } from "constants/userConstants";
import { AUTH_LOGIN_URL, APPLICATIONS_URL } from "constants/routes";
import Button from "components/editorComponents/Button";
import history from "utils/history";
import { Colors } from "constants/Colors";
import ProfileDropdown from "./ProfileDropdown";
import Bell from "notifications/Bell";

import { areCommentsEnabledForUserAndApp as areCommentsEnabledForUserAndAppSelector } from "selectors/commentsSelectors";

const StyledPageHeader = styled(StyledHeader)`
  background: ${Colors.BALTIC_SEA};
  height: 48px;
  color: white;
  flex-direction: row;
  position: fixed;
  top: 0;
  z-index: 10;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
`;

const HeaderSection = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
`;

const StyledDropDownContainer = styled.div``;

const AppsmithLogoImg = styled.img`
  max-width: 110px;
`;

type PageHeaderProps = {
  user?: User;
};

export function PageHeader(props: PageHeaderProps) {
  const { user } = props;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  let loginUrl = AUTH_LOGIN_URL;
  if (queryParams.has("redirectUrl")) {
    loginUrl += `?redirectUrl
    =${queryParams.get("redirectUrl")}`;
  }

  const areCommentsEnabledForUserAndApp = useSelector(
    areCommentsEnabledForUserAndAppSelector,
  );

  return (
    <StyledPageHeader>
      <HeaderSection>
        <Link className="t--appsmith-logo" to={APPLICATIONS_URL}>
          <AppsmithLogoImg alt="Appsmith logo" src={AppsmithLogo} />
        </Link>
      </HeaderSection>
      {user && (
        <>
          {areCommentsEnabledForUserAndApp && <Bell />}
          <StyledDropDownContainer>
            {user.username === ANONYMOUS_USERNAME ? (
              <Button
                filled
                intent={"primary"}
                onClick={() => history.push(loginUrl)}
                size="small"
                text="Sign In"
              />
            ) : (
              <ProfileDropdown name={user.name} userName={user.username} />
            )}
          </StyledDropDownContainer>
        </>
      )}
    </StyledPageHeader>
  );
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
});

export default connect(mapStateToProps)(PageHeader);
