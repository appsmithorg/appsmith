import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "components/ads/Spinner";
import { Classes } from "components/ads/common";
import { AppState } from "reducers";
import { endOnboarding, setCurrentStep } from "actions/onboardingActions";

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
  padding: 80px 0px;
`;

const WelcomeText = styled.div`
  font-size: 36px;
  font-weight: bold;
  color: #090707;
  text-align: center;
`;

const Description = styled.div`
  font-size: 17px;
  color: #716e6e;
  margin-top: 16px;
  text-align: center;
`;

const NotNewUserText = styled.span`
  color: #716e6e;
  margin-top: 24px;
  text-align: center;

  span {
    color: #457ae6;
    cursor: pointer;
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
  const dispatch = useDispatch();
  const creatingDatabase = useSelector(
    (state: AppState) => state.ui.onBoarding.creatingDatabase,
  );

  if (creatingDatabase) {
    return (
      <Wrapper>
        <LoadingContainer>
          <Spinner />
          <span>Creating Example Database</span>
        </LoadingContainer>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Container>
        <div>
          <WelcomeText>
            <span role="img" aria-label="hello">
              👋
            </span>{" "}
            Welcome
          </WelcomeText>
          <Description>
            Appsmith helps you build quality internal tools, fast!
          </Description>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <StyledButton
            className="t--create-database"
            onClick={() => {
              dispatch(setCurrentStep(1));
            }}
          >
            Explore Appsmith
          </StyledButton>
          <NotNewUserText>
            Not your first time with Appsmith?{" "}
            <span onClick={() => dispatch(endOnboarding())}>
              Skip this tutorial
            </span>
          </NotNewUserText>
        </div>
      </Container>
    </Wrapper>
  );
};

export default Welcome;
