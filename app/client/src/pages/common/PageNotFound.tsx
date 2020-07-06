import React from "react";
import { RouterProps } from "react-router";
import styled from "styled-components";
import Button from "components/editorComponents/Button";
import PageUnavailableImage from "assets/images/404-image.png";
import PageHeader from "pages/common/PageHeader";
import { BASE_URL } from "constants/routes";

const Wrapper = styled.div`
  text-align: center;
  margin-top: 5%;
  .boldText {
    font-weight: 800;
    font-size: 24px;
  }
  .pageUnavailableImg {
    width: 35%;
  }
  .buttonPosition {
    margin: auto;
  }
`;

class PageNotFound extends React.PureComponent<RouterProps> {
  public render() {
    return (
      <>
        <PageHeader />
        <Wrapper>
          <img
            src={PageUnavailableImage}
            alt="Page Unavailable"
            className="pageUnavailableImg"
          ></img>
          <div>
            <p className="boldText">Page not found</p>
            <p>
              Either this page doesn't exist, or you don't have access to <br />
              this page.
            </p>
            <Button
              filled
              text="Go back to homepage"
              intent="primary"
              icon="arrow-right"
              iconAlignment="right"
              size="small"
              className="buttonPosition"
              onClick={() => this.props.history.push(BASE_URL)}
            />
          </div>
        </Wrapper>
      </>
    );
  }
}

export default PageNotFound;
