import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { APPLICATIONS_URL } from "constants/routes";
import Button from "components/editorComponents/Button";
import { flushErrorsAndRedirect } from "actions/errorActions";
import PageUnavailableImage from "assets/images/404-image.png";
import {
  BACK_TO_HOMEPAGE,
  createMessage,
  PAGE_NOT_FOUND,
} from "constants/messages";

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
}

function PageNotFound(props: Props) {
  const { flushErrorsAndRedirect } = props;

  return (
    <Wrapper>
      <img
        alt="Page Unavailable"
        className="page-unavailable-img"
        src={PageUnavailableImage}
      />
      <div>
        <p className="bold-text">{createMessage(PAGE_NOT_FOUND)}</p>
        <p>
          Either this page doesn&apos;t exist, or you don&apos;t have access to{" "}
          <br />
          this page.
        </p>
        <Button
          className="button-position"
          filled
          icon="arrow-right"
          iconAlignment="right"
          intent="primary"
          onClick={() => flushErrorsAndRedirect(APPLICATIONS_URL)}
          size="small"
          text={createMessage(BACK_TO_HOMEPAGE)}
        />
      </div>
    </Wrapper>
  );
}

export default connect(null, {
  flushErrorsAndRedirect,
})(PageNotFound);
