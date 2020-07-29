import React from "react";
import { RouterProps } from "react-router";
import styled from "styled-components";
import Button from "components/editorComponents/Button";
import PageUnavailableImage from "assets/images/404-image.png";
import { BASE_URL } from "constants/routes";

const Wrapper = styled.div`
  text-align: center;
  margin-top: 5%;
  .bold-text {
    font-weight: ${props => props.theme.fontWeights[3]};
    font-size: 24px;
  }
  .page-unavailable-img {
    width: 35%;
  }
  .button-position {
    margin: auto;
  }
`;

class PageNotFound extends React.PureComponent<RouterProps> {
  public render() {
    return (
      <>
        <Wrapper>
          <img
            src={PageUnavailableImage}
            alt="Page Unavailable"
            className="page-unavailable-img"
          />
          <div>
            <p className="bold-text">Page not found</p>
            <p>
              Either this page doesn&apos;t exist, or you don&apos;t have access
              to <br />
              this page.
            </p>
            <Button
              filled
              text="Go back to homepage"
              intent="primary"
              icon="arrow-right"
              iconAlignment="right"
              size="small"
              className="button-position"
              onClick={() => this.props.history.push(BASE_URL)}
            />
          </div>
        </Wrapper>
      </>
    );
  }
}

export default PageNotFound;
