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
      stroke: #457ae6;
    }
  }
`;

const Image = styled.img`
  width: 601px;
  height: 341px;
  margin-top: 24px;
  object-fit: scale-down;

  @media only screen and (min-height: 800px) {
    height: 441px;
    width: 801px;
  }
`;

const SubTitle = styled.div`
  font-size: 12px;
  text-align: center;
`;

const Title = styled.div`
  font-size: 24px;
  font-weight: 500;
  text-align: center;
`;

const Description = styled.div`
  font-size: 16px;
  margin-top: 18px;
  width: 490px;
  margin-top: 24px;

  @media only screen and (min-height: 800px) {
    width: 630px;
  }
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
      <SubTitle>WHAT WE’LL BUILD</SubTitle>
      <Title>Super Standup App</Title>
      <Image
        src={
          "https://res.cloudinary.com/drako999/image/upload/v1611859209/Appsmith/Onboarding/standup_app.gif"
        }
      />
      <Description>
        🦸🏻‍♂️ Superheroes much like engineers have to coordinate their daily plans
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
        <Spinner />
      )}
    </Wrapper>
  );
};

export default Welcome;
