import React from "react";
import styled from "styled-components";
import AppTimeoutImage from "assets/images/timeout-image.png";
import { Button, Size } from "design-system";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: calc(100vh - ${(props) => props.theme.headerHeight});
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

function ServerTimeout() {
  return (
    <Wrapper className="space-y-6">
      <img
        alt="Page Unavailable"
        className="page-unavailable-img"
        src={AppTimeoutImage}
      />
      <div className="space-y-2">
        <p className="bold-text">
          Appsmith server is taking too long to respond
        </p>
        <p>Please retry after some time</p>
        <Button
          category="primary"
          className="button-position"
          fill="true"
          onClick={() => window.location.reload()}
          size={Size.large}
          tag="button"
          text="Retry"
          variant="info"
        />
      </div>
    </Wrapper>
  );
}

export default ServerTimeout;
