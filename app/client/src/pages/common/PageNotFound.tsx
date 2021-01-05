import React from "react";
import { get } from "lodash";
import { AppState } from "reducers";
import { connect } from "react-redux";
import styled from "styled-components";
import { ERROR_CODES } from "constants/ApiConstants";
import Button from "components/editorComponents/Button";
import { getCurrentUser } from "selectors/usersSelectors";
import { getSafeCrashCode } from "selectors/errorSelectors";
import { flushErrorsAndRedirect } from "actions/errorActions";
import PageUnavailableImage from "assets/images/404-image.png";
import { APPLICATIONS_URL, AUTH_LOGIN_URL } from "constants/routes";

const Wrapper = styled.div`
  text-align: center;
  margin-top: 5%;
  .bold-text {
    font-weight: ${(props) => props.theme.fontWeights[3]};
    font-size: 24px;
  }
  .page-unavailable-img {
    width: 35%;
  }
  .button-position {
    margin: auto;
  }
`;

interface Props {
  flushErrorsAndRedirect?: any;
  user?: any;
  safeCrashCode?: ERROR_CODES;
}

const PageNotFound: React.FC<Props> = (props: Props) => {
  const { flushErrorsAndRedirect, user } = props;

  // if user is not logged, directly take him to the login page with `redirectTo` param
  if (get(user, "email") === "anonymousUser") {
    window.location.href = `${AUTH_LOGIN_URL}?redirectTo=${window.location.href}`;

    return <></>;
  }

  return (
    <Wrapper>
      <img
        src={PageUnavailableImage}
        alt="Page Unavailable"
        className="page-unavailable-img"
      />
      <div>
        <p className="bold-text">Page not found</p>
        <p>
          Either this page doesn&apos;t exist, or you don&apos;t have access to{" "}
          <br />
          this page.
        </p>
        <Button
          filled
          text="Go back to homepage"
          intent="primary"
          icon="arrow-right"
          iconAlignment="right"
          size="small"
          className="button-position"
          onClick={() => flushErrorsAndRedirect(APPLICATIONS_URL)}
        />
      </div>
    </Wrapper>
  );
};

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
  safeCrashCode: getSafeCrashCode(state),
});

export default connect(mapStateToProps, {
  flushErrorsAndRedirect,
})(PageNotFound);
