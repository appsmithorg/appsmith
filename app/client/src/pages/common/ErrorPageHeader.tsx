import React from "react";
import { Link, useLocation } from "react-router-dom";
import { connect, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import { AppState } from "@appsmith/reducers";
import { User, ANONYMOUS_USERNAME } from "constants/userConstants";
import { AUTH_LOGIN_URL, APPLICATIONS_URL } from "constants/routes";
import Button from "components/editorComponents/Button";
import { Colors } from "constants/Colors";
import ProfileDropdown from "./ProfileDropdown";
import { flushErrorsAndRedirect, flushErrors } from "actions/errorActions";
import { getSafeCrash } from "selectors/errorSelectors";
import { Indices } from "constants/Layers";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";

const StyledPageHeader = styled(StyledHeader)`
  box-shadow: none;
  justify-content: normal;
  background: white;
  height: 48px;
  color: white;
  position: fixed;
  top: 0;
  z-index: ${Indices.Layer9};
  box-shadow: 0px 1px 0px ${Colors.GALLERY_2};
`;

const HeaderSection = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
`;

const StyledDropDownContainer = styled.div``;

type ErrorPageHeaderProps = {
  user?: User;
  flushErrors?: any;
  flushErrorsAndRedirect?: any;
  safeCrash: boolean;
};

export function ErrorPageHeader(props: ErrorPageHeaderProps) {
  const { flushErrors, flushErrorsAndRedirect, safeCrash, user } = props;
  const location = useLocation();
  const tenantConfig = useSelector(getTenantConfig);
  const queryParams = new URLSearchParams(location.search);
  let loginUrl = AUTH_LOGIN_URL;
  const redirectUrl = queryParams.get("redirectUrl");
  if (redirectUrl != null) {
    loginUrl += `?redirectUrl=${encodeURIComponent(redirectUrl)}`;
  }

  return (
    <StyledPageHeader>
      <HeaderSection>
        {tenantConfig.brandLogoUrl && (
          <Link
            className="t--appsmith-logo"
            onClick={() => {
              if (safeCrash) flushErrors();
            }}
            to={APPLICATIONS_URL}
          >
            <img alt="Logo" className="h-6" src={tenantConfig.brandLogoUrl} />
          </Link>
        )}
      </HeaderSection>
      {user && (
        <StyledDropDownContainer>
          {user.username === ANONYMOUS_USERNAME ? (
            <Button
              filled
              intent={"primary"}
              onClick={() => {
                flushErrorsAndRedirect(loginUrl);
              }}
              size="small"
              text="Sign In"
            />
          ) : (
            <ProfileDropdown
              name={user.name}
              photoId={user?.photoId}
              userName={user.username}
            />
          )}
        </StyledDropDownContainer>
      )}
    </StyledPageHeader>
  );
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
  safeCrash: getSafeCrash(state),
});

export default connect(mapStateToProps, {
  flushErrors,
  flushErrorsAndRedirect,
})(ErrorPageHeader);
