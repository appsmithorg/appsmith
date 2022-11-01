import React from "react";
import styled from "styled-components";
import PageUnavailableImage from "assets/images/404-image.png";
import { Button, Size } from "design-system";

const Wrapper = styled.div`
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  background-color: #fafafa;
  text-align: center;
  padding-top: calc(${(props) => props.theme.headerHeight} + 50px);
  .bold-text {
    font-weight: ${(props) => props.theme.fontWeights[3]};
    font-size: 24px;
  }
  .page-unavailable-img {
    width: 35%;
    margin: auto;
  }
  .button-position {
    margin: auto;
  }
`;

function ServerUnavailable() {
  return (
    <Wrapper className="space-y-6">
      <img
        alt="Page Unavailable"
        className="page-unavailable-img"
        src={PageUnavailableImage}
      />
      <div className="space-y-2">
        <p className="bold-text">Appsmith server is unavailable</p>
        <p>Please try again after some time</p>
        <Button
          category="primary"
          className="button-position"
          fill="true"
          onClick={() => window.location.reload()}
          size={Size.large}
          tag="button"
          text={"Retry"}
          variant="info"
        />
      </div>
    </Wrapper>
  );
}

export default ServerUnavailable;
