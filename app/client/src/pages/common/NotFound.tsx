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

const NotFound: React.FC<Props> = (props: Props) => {
  const { title, subtitle, buttonText, onBackButton } = props;

  return (
    <Wrapper>
      <img
        src={IntegrationUnavailableImage}
        alt={title || "Unavailable"}
        className="unavailable-img"
      />
      <div>
        <p className="bold-text">{title}</p>
        {subtitle && <p>{subtitle}</p>}
        <Button
          filled
          text={buttonText}
          intent="primary"
          icon="arrow-right"
          iconAlignment="right"
          size="small"
          className="button-position"
          onClick={() => onBackButton()}
        />
      </div>
    </Wrapper>
  );
};

export default NotFound;
