import React from "react";
import styled from "styled-components";
import Button from "components/editorComponents/Button";
import IntegrationUnavailableImage from "assets/images/404-image.png";

const Wrapper = styled.div`
  text-align: center;
  margin-top: 5%;
  .bold-text {
    font-weight: ${(props) => props.theme.fontWeights[3]};
    font-size: 24px;
  }
  .unavailable-img {
    width: 35%;
  }
  .button-position {
    margin: auto;
  }
`;

interface Props {
  title: string;
  subtitle?: string;
  buttonText: string;
  onBackButton: () => void;
}

function NotFound(props: Props) {
  const { buttonText, onBackButton, subtitle, title } = props;

  return (
    <Wrapper>
      <img
        alt={title || "Unavailable"}
        className="unavailable-img"
        src={IntegrationUnavailableImage}
      />
      <div>
        <p className="bold-text">{title}</p>
        {subtitle && <p>{subtitle}</p>}
        <Button
          className="button-position"
          filled
          icon="arrow-right"
          iconAlignment="right"
          intent="primary"
          onClick={() => onBackButton()}
          size="small"
          text={buttonText}
        />
      </div>
    </Wrapper>
  );
}

export default NotFound;
