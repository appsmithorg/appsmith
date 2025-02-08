import React, { useCallback } from "react";
import { Link, Tooltip } from "@appsmith/ads";
import styled from "styled-components";
import { LOGO_TOOLTIP, createMessage } from "ee/constants/messages";
import { APPLICATIONS_URL } from "constants/routes";
import AppsmithLogo from "assets/images/appsmith_logo_square.png";
import history from "utils/history";

export const StyledLink = styled((props) => {
  // we are removing non input related props before passing them in the components
  // eslint-disable @typescript-eslint/no-unused-vars
  return <Link {...props} />;
})`
  height: 24px;
  min-width: 24px;
  width: 24px;
  display: inline-block;

  img {
    min-width: 24px;
    width: 24px;
    height: 24px;
  }
`;

export const AppsmithLink = () => {
  const handleOnClick = useCallback(() => {
    history.push(APPLICATIONS_URL);
  }, []);

  return (
    <Tooltip content={createMessage(LOGO_TOOLTIP)} placement="bottomLeft">
      <StyledLink onClick={handleOnClick}>
        <img
          alt="Appsmith logo"
          className="t--appsmith-logo"
          src={AppsmithLogo}
        />
      </StyledLink>
    </Tooltip>
  );
};
