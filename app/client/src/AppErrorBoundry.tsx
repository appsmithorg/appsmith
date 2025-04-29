import React, { Component } from "react";
import styled from "styled-components";
import AppCrashImage from "assets/images/404-image.png";
import log from "loglevel";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { Button } from "@appsmith/ads";
import { appsmithTelemetry } from "instrumentation";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: calc(100vh - ${(props) => props.theme.headerHeight});
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

class AppErrorBoundary extends Component {
  state = {
    hasError: false,
  };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error({ error, errorInfo });
    appsmithTelemetry.captureException(error, {
      errorName: "AppErrorBoundary",
    });
    AnalyticsUtil.logEvent("APP_CRASH", { error, errorInfo });
    this.setState({
      hasError: true,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Wrapper>
          <img alt="App crashed" src={AppCrashImage} />
          <div>
            <p className="bold-text">Oops! Something went wrong</p>
            <p>
              Please try again using the button below. <br />
              If the issue persists, please contact us
            </p>
            <br />
            <Button onClick={() => window.location.reload()} size="md">
              Retry
            </Button>
          </div>
        </Wrapper>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
