import React from "react";
import styled from "styled-components";
import PageUnavailableImage from "assets/images/404-image.png";

const Wrapper = styled.div`
  text-align: center;
  margin-top: 5%;
  .bold-text {
    font-weight: ${props => props.theme.fontWeights[3]};
    font-size: 24px;
  }
  .page-unavailable-img {
    width: 35%;
  }
  .button-position {
    margin: auto;
  }
`;

const ServerUnavailable = () => {
  return (
    <Wrapper>
      <img
        src={PageUnavailableImage}
        alt="Page Unavailable"
        className="page-unavailable-img"
      />
      <div>
        <p className="bold-text">Appsmith server is unavailable</p>
        <p>Please try again after some time</p>
      </div>
    </Wrapper>
  );
};

export default ServerUnavailable;
