import React from "react";
import styled from "styled-components";
import Button, { Size, Category } from "components/ads/Button";
import PageUnavailableImage from "assets/images/invalid-page.png";
import {
  PAGE_NOT_FOUND_ERROR,
  INVALID_URL_ERROR,
  createMessage,
} from "constants/messages";
import { useHistory } from "react-router-dom";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  justify-content: flex-start;
  padding-top: 15%;
  background: #fcfcfc;
  position: absolute;
  width: 100%;
  height: 100%;
  .page-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 450px;
  }
  .bold-text {
    font-weight: ${(props) => props.theme.fontWeights[3]};
    font-size: 24px;
    margin-top: 20px;
  }
  .page-message {
    margin-top: 14px;
    color: #716e6e;
    font-size: 14px;
    line-height: 17px;
    letter-spacing: 0.733333px;
  }
  .page-unavailable-img {
    width: 72px;
  }
  .button-position {
    margin-top: 14px;
  }
`;

const EntityNotFoundPane = () => {
  const history = useHistory();
  return (
    <Wrapper>
      <img
        src={PageUnavailableImage}
        alt="Page Unavailable"
        className="page-unavailable-img"
      />
      <div className="page-details">
        <p className="bold-text">{createMessage(INVALID_URL_ERROR)}</p>
        <p className="page-message">{createMessage(PAGE_NOT_FOUND_ERROR)}</p>
        <Button
          tag="button"
          text="Go Back"
          cypressSelector="t--invalid-page-go-back"
          className="button-position"
          size={Size.large}
          category={Category.secondary}
          onClick={history.goBack}
        />
      </div>
    </Wrapper>
  );
};

export default EntityNotFoundPane;
