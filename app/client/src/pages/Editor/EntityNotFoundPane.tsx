import React from "react";
import styled from "styled-components";
import Button from "components/editorComponents/Button";
import PageUnavailableImage from "assets/images/404-image.png";
import { useHistory } from "react-router-dom";

const Wrapper = styled.div`
  text-align: center;
  padding-top: 5%;
  .bold-text {
    font-weight: ${(props) => props.theme.fontWeights[3]};
    font-size: 24px;
  }
  .page-unavailable-img {
    width: 35%;
  }
  .button-position {
    margin: auto;
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
      <div>
        <p className="bold-text">Entity not found</p>
        <p>
          Either this entity doesn&apos;t exist, or you don&apos;t have access
          to <br />
          this entity.
        </p>
        <Button
          filled
          text="Go Back"
          intent="primary"
          icon="arrow-right"
          iconAlignment="right"
          size="small"
          className="button-position"
          onClick={() => history.goBack()}
        />
      </div>
    </Wrapper>
  );
};

export default EntityNotFoundPane;
