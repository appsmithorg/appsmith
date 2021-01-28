import React from "react";
import styled from "styled-components";
import Spinner from "components/ads/Spinner";
import { Classes } from "components/ads/common";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

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
    margin-top: 24px;

    circle {
      stroke: #f3672a;
    }
  }
`;

const Container = styled.div`
  width: 481px;
  padding: 20px;
  border: 2px solid #df613c;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 277px;
  background-color: grey;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-top: 24px;
  text-align: center;
`;

const Description = styled.div`
  font-size: 14px;
  margin-top: 17px;
`;

const LoadingMessage = styled.span`
  font-size: 14px;
  color: #9f9f9f;
  margin-top: 11px;
`;

const SpinnerWrapper = styled.div`
  flex-direction: column;
  display: flex;
  align-items: center;
`;

const StyledButton = styled.button`
  color: white;
  background-color: #f3672a;
  font-weight: bold;
  font-size: 17px;
  padding: 12px 24px;
  border: none;
  cursor: pointer;
  margin-top: 24px;
`;

const Welcome = () => {
  const datasourceCreated = useSelector(
    (state: AppState) => state.ui.onBoarding.createdDBQuery,
  );
  const dispatch = useDispatch();

  return (
    <Wrapper>
      <Container>
        <ImagePlaceholder />
        <Title>Super-Standup App</Title>
        <Description>
          Superheroes much like engineers have to coordinate their daily plans
          so that no villain (bug) gets away! However, all heroes hate morning
          meetings so a daily standup app is just what we need.
        </Description>
        {datasourceCreated ? (
          <StyledButton
            onClick={() => {
              dispatch({
                type: ReduxActionTypes.SHOW_WELCOME,
                payload: false,
              });
            }}
          >
            Start Building
          </StyledButton>
        ) : (
          <SpinnerWrapper>
            <Spinner />
            <LoadingMessage>
              Creating Database of Superhero Updates
            </LoadingMessage>
          </SpinnerWrapper>
        )}
      </Container>
    </Wrapper>
  );
};

export default Welcome;
