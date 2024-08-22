import React from "react";

import { AUTH_LOGIN_URL } from "constants/routes";
import { requiresUnauth } from "pages/UserAuth/requiresAuthHOC";
import { useSelector } from "react-redux";
import { Redirect } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";

import UserWelcomeScreen from "./UserWelcomeScreen";

const StyledSetupContainer = styled.div`
  background-color: ${(props) => props.theme.colors.homepageBackground};
  height: 100vh;
  overflow: hidden;
`;

function Setup() {
  const user = useSelector(getCurrentUser);
  if (!user?.emptyInstance) {
    return <Redirect to={AUTH_LOGIN_URL} />;
  }

  return (
    <StyledSetupContainer>
      <UserWelcomeScreen isSuperUser />
    </StyledSetupContainer>
  );
}

export default requiresUnauth(Setup);
