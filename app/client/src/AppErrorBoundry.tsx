import React, { Component } from "react";
import styled from "styled-components";
import AppCrashImage from "assets/images/404-image.png";
import * as Sentry from "@sentry/react";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: calc(100vh - ${props => props.theme.headerHeight});
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

const RetryButton = styled.button`
  background-color: #f3672a;
  color: white;
  height: 40px;
  width: 300px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 17px;
`;

class AppErrorBoundary extends Component {
  state = {
    hasError: false,
  };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error({ error, errorInfo });
    Sentry.captureException(error);
    this.setState({
      hasError: true,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Wrapper>
          <img src={AppCrashImage} alt="App crashed" />
          <div>
            <p className="bold-text">Oops! Something went wrong</p>
            <p>Please retry and contact us if this happens again</p>
            <RetryButton onClick={() => window.location.reload()}>
              {"Retry"}
            </RetryButton>
          </div>
        </Wrapper>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
