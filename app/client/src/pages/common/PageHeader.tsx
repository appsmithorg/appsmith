import React from "react";
import { Link, useLocation } from "react-router-dom";
import { connect } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled, { css } from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import { ReactComponent as AppsmithLogo } from "assets/svg/appsmith_logo_primary.svg";
import { AppState } from "reducers";
import { User, ANONYMOUS_USERNAME } from "constants/userConstants";
import { AUTH_LOGIN_URL, APPLICATIONS_URL } from "constants/routes";
import Button from "components/editorComponents/Button";
import history from "utils/history";
import ProfileDropdown from "./ProfileDropdown";
import Bell from "notifications/Bell";

const StyledPageHeader = styled(StyledHeader)<{
  hideShadow?: boolean;
  showSeparator?: boolean;
}>`
  background: white;
  height: 48px;
  color: white;
  flex-direction: row;
  position: fixed;
  top: 0;
  z-index: 10;
  box-shadow: ${(props) =>
    props.hideShadow ? `none` : `0px 4px 4px rgba(0, 0, 0, 0.05)`};
  ${(props) => props.showSeparator && sideBorder}
`;

const HeaderSection = styled.div`
  display: flex;
  flex: 1;
  align-items: center;

  .t--appsmith-logo {
    svg {
      max-width: 110px;
      width: 110px;
    }
  }
`;

const sideBorder = css`
  &:after {
    content: "";
    position: absolute;
    left: ${(props) => props.theme.homePage.sidebar}px;
    width: 1px;
    height: 100%;
    background-color: #ededed;
  }
`;

const StyledDropDownContainer = styled.div``;

type PageHeaderProps = {
  user?: User;
  hideShadow?: boolean;
  showSeparator?: boolean;
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

  return (
    <StyledPageHeader
      hideShadow={props.hideShadow || false}
      showSeparator={props.showSeparator || false}
    >
      <HeaderSection>
        <Link className="t--appsmith-logo" to={APPLICATIONS_URL}>
          <AppsmithLogo />
        </Link>
      </HeaderSection>
      {user && (
        <>
          {user.username !== ANONYMOUS_USERNAME && <Bell />}
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
              <ProfileDropdown
                name={user.name}
                photoId={user.photoId}
                userName={user.username}
              />
            )}
          </StyledDropDownContainer>
        </>
      )}
    </StyledPageHeader>
  );
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
  hideShadow: state.ui.theme.hideHeaderShadow,
  showSeparator: state.ui.theme.showHeaderSeparator,
});

export default connect(mapStateToProps)(PageHeader);
