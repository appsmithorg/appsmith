import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Rating from "react-rating";
import { Button, Icon, Text } from "design-system";
import {
  getPostWelcomeTourState,
  setPostWelcomeTourState,
} from "utils/storage";
import { getQueryParams } from "utils/URLUtils";
import { useDispatch } from "react-redux";
import { showPostCompletionMessage } from "actions/onboardingActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  END_BUTTON_TEXT,
  END_DESCRIPTION,
  END_TITLE,
  RATING_DESCRIPTION,
  RATING_TEXT,
  RATING_TITLE,
} from "@appsmith/constants/messages";
import history from "utils/history";
import { APPLICATIONS_URL } from "constants/routes";

const Container = styled.div`
  background-color: var(--ads-v2-color-bg-success);
  padding: var(--ads-v2-spaces-5);
  width: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title {
    color: var(--ads-v2-color-fg-emphasis);
  }
`;

const Confetti = styled.span`
  font-size: 30px;
  margin-right: var(--ads-v2-spaces-5);
`;

const Description = styled.div`
  font-size: 14px;
  line-height: 16px;
  margin-top: var(--ads-v2-spaces-2);
`;

const RatingText = styled.span`
  /* color: #000000; */
`;

const RatingWrapper = styled.div`
  display: flex;
  align-items: center;

  .star {
    padding: 0 5px;
  }
`;

const Left = styled.div`
  display: flex;
`;

function CongratulationsView() {
  const [ratingComplete, setRatingComplete] = useState(false);
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();

  const onValueChanged = (value: number) => {
    AnalyticsUtil.logEvent("GUIDED_TOUR_RATING", {
      rating: value,
    });
    setRatingComplete(true);
  };

  useEffect(() => {
    const inPostCompletionState = async () => {
      const postCompletionMessage = await getPostWelcomeTourState();
      const queryParams = getQueryParams();

      if (queryParams.guidedTourComplete === "true" && postCompletionMessage) {
        setShow(true);
        dispatch(showPostCompletionMessage(true));
      }
    };

    inPostCompletionState();
  }, [dispatch]);

  const hideMessage = () => {
    setShow(false);
    dispatch(showPostCompletionMessage(false));
    setPostWelcomeTourState(false);
    history.push(APPLICATIONS_URL);
  };

  if (!show) return null;

  if (!ratingComplete) {
    return (
      <Container>
        <Wrapper>
          <Left>
            <Confetti>🎉</Confetti>
            <div>
              <Text className="title" kind="heading-s" renderAs="h2">
                {createMessage(RATING_TITLE)}
              </Text>
              <Description>{createMessage(RATING_DESCRIPTION)}</Description>
            </div>
          </Left>
          <RatingWrapper>
            <RatingText>{createMessage(RATING_TEXT)}</RatingText>
            <Rating
              emptySymbol={
                <Icon
                  className={"t--guided-tour-rating star"}
                  color={"var(--ads-v2-color-fg-success)"}
                  name="star-line"
                  size="lg"
                />
              }
              fullSymbol={
                <Icon
                  className={"t--guided-tour-rating star"}
                  color={"var(--ads-v2-color-fg-success)"}
                  name="star-fill"
                  size="lg"
                />
              }
              onChange={onValueChanged}
            />
          </RatingWrapper>
        </Wrapper>
      </Container>
    );
  } else {
    return (
      <Container>
        <Wrapper>
          <div>
            <Text className="title" kind="heading-s" renderAs="h2">
              {createMessage(END_TITLE)}
            </Text>
            <Description>{createMessage(END_DESCRIPTION)}</Description>
          </div>
          <Button className="t--start-building" onClick={hideMessage} size="md">
            {createMessage(END_BUTTON_TEXT)}
          </Button>
        </Wrapper>
      </Container>
    );
  }
}

export default CongratulationsView;
