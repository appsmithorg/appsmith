import React from "react";
import styled from "styled-components";
import Spinner from "components/ads/Spinner";
import { Classes } from "components/ads/common";

const Wrapper = styled.div`
  height: calc(100vh - 48px);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: white;

  .${Classes.SPINNER} {
    width: 43px;
    height: 43px;

    circle {
      stroke: #f3672a;
    }
  }

  span {
    font-size: 17px;
    margin-top: 23px;
  }
`;

const Welcome = () => {
  return (
    <Wrapper>
      <Spinner />
      <span>Connecting to an example Postgres database</span>
    </Wrapper>
  );
};

export default Welcome;
