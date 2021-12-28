import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Rating from "react-rating";
import Icon, { IconSize } from "components/ads/Icon";
import Button, { Size } from "components/ads/Button";
import {
  getPostWelcomeTourState,
  setPostWelcomeTourState,
} from "utils/storage";
import { getQueryParams } from "utils/AppsmithUtils";
import { useDispatch } from "react-redux";
import { showPostCompletionMessage } from "actions/onboardingActions";
import { useSelector } from "store";
import { getEditorURL } from "selectors/appViewSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  END_BUTTON_TEXT,
  END_DESCRIPTION,
  END_TITLE,
  RATING_DESCRIPTION,
  RATING_TEXT,
  RATING_TITLE,
} from "constants/messages";

const Container = styled.div`
  background-color: #ffefdb;
  padding: 20px 24px;
  width: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Confetti = styled.span`
  font-size: 40px;
  margin-right: 16px;
`;

const Title = styled.div`
  font-size: 40px;
  color: #000000;
  font-size: 18px;
  font-weight: 600;
`;

const Description = styled.div`
  color: #090707;
  font-size: 16px;
  margin-top: 8px;
`;

const RatingText = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  padding-bottom: 5px;
  margin-right: 17px;
`;

const RatingWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Left = styled.div`
  display: flex;
`;

function CongratulationsView() {
  const [ratingComplete, setRatingComplete] = useState(false);
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const editorUrl = useSelector(getEditorURL);

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
  };

  if (!show) return null;

  if (!ratingComplete) {
    return (
      <Container>
        <Wrapper>
          <Left>
            <Confetti>🎉</Confetti>
            <div>
              <Title>{createMessage(RATING_TITLE)}</Title>
              <Description>{createMessage(RATING_DESCRIPTION)}</Description>
            </div>
          </Left>
          <RatingWrapper>
            <RatingText>{createMessage(RATING_TEXT)}</RatingText>
            <Rating
              emptySymbol={
                <Icon
                  className={"t--guided-tour-rating"}
                  fillColor={"#858282"}
                  name="star-line"
                  size={IconSize.XXXXL}
                />
              }
              fullSymbol={
                <Icon
                  fillColor={"#FFCB45"}
                  name="star-fill"
                  size={IconSize.XXXXL}
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
            <Title>{createMessage(END_TITLE)}</Title>
            <Description>{createMessage(END_DESCRIPTION)}</Description>
          </div>
          <Button
            className="t--start-building"
            height="38"
            href={editorUrl}
            onClick={hideMessage}
            size={Size.large}
            text={createMessage(END_BUTTON_TEXT)}
            type="button"
          />
        </Wrapper>
      </Container>
    );
  }
}

export default CongratulationsView;
