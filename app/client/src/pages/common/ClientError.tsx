import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import Button from "components/editorComponents/Button";
import { flushErrors } from "actions/errorActions";
import PageUnavailableImage from "assets/images/404-image.png";

const Wrapper = styled.div`
  text-align: center;
  margin-top: 5%;
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

interface Props {
  flushErrors?: any;
}

const ClientError: React.FC<Props> = (props: Props) => {
  const { flushErrors } = props;

  return (
    <Wrapper>
      <img
        src={PageUnavailableImage}
        alt="Page Unavailable"
        className="page-unavailable-img"
      />
      <div>
        <p className="bold-text">Whoops something went wrong!</p>
        <p>This is embarrassing, please contact Appsmith support for help</p>
        <Button
          filled
          text="Contact us on discord"
          intent="primary"
          icon="arrow-right"
          iconAlignment="right"
          size="small"
          className="button-position"
          onClick={() => {
            flushErrors();
            window.open("https://discord.gg/rBTTVJp", "_blank");
          }}
        />
      </div>
    </Wrapper>
  );
};

export default connect(null, {
  flushErrors,
})(ClientError);
