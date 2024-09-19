import React from "react";
import styled from "styled-components";
import { Button } from "@appsmith/ads";
import PageUnavailableImage from "assets/images/invalid-page.png";
import {
  PAGE_NOT_FOUND_ERROR,
  INVALID_URL_ERROR,
  createMessage,
} from "ee/constants/messages";
import { useHistory } from "react-router-dom";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  justify-content: flex-start;
  padding-top: 15%;
  background: var(--ads-v2-color-bg);
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
    color: var(--ads-v2-color-fg);
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

interface Props {
  goBackFn?: () => void; // custom function for returning to any declared route.
}

function EntityNotFoundPane(props: Props) {
  const history = useHistory();

  return (
    <Wrapper>
      <img
        alt="Page Unavailable"
        className="page-unavailable-img"
        src={PageUnavailableImage}
      />
      <div className="page-details">
        <p className="bold-text">{createMessage(INVALID_URL_ERROR)}</p>
        <p className="page-message">{createMessage(PAGE_NOT_FOUND_ERROR)}</p>
        <Button
          className="button-position"
          kind="secondary"
          onClick={props.goBackFn ? props.goBackFn : () => history.goBack()}
          size="md"
        >
          Go Back
        </Button>
      </div>
    </Wrapper>
  );
}

export default EntityNotFoundPane;
