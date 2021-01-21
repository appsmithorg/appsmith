import React from "react";
import styled from "styled-components";
import Spinner from "components/ads/Spinner";
import { Classes } from "components/ads/common";

const Wrapper = styled.div`
  height: 100%;
  padding: 85px 55px;
  flex: 1;
  display: flex;
`;

const Container = styled.div`
  align-self: stretch;
  flex: 1;
  display: flex;
  background-color: white;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 60px;
`;

const LoadingContainer = styled(Container)`
  justify-content: center;
  padding: 0px;

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
      <LoadingContainer>
        <Spinner />
        <span>Creating an example Postgres database</span>
      </LoadingContainer>
    </Wrapper>
  );
};

export default Welcome;
