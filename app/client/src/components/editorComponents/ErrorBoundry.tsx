import React, { ReactNode } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import * as log from "loglevel";

type Props = { children: ReactNode };
type State = { hasError: boolean };

const ErrorBoundaryContainer = styled.div`
  height: 100%;
  width: 100%;

  > div {
    height: 100%;
    width: 100%;
  }
`;
// border: 1px solid;
// border-color: ${({ isValid, theme }) =>
//   isValid ? "transparent" : theme.colors.error};

const RetryLink = styled.span`
  color: ${(props) => props.theme.colors.primaryDarkest};
  cursor: pointer;
`;

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    log.error({ error, errorInfo });
    Sentry.captureException(error);
  }

  render() {
    return (
      <ErrorBoundaryContainer>
        {this.state.hasError ? (
          <p>
            Oops, Something went wrong.
            <br />
            <RetryLink onClick={() => this.setState({ hasError: false })}>
              Click here to retry
            </RetryLink>
          </p>
        ) : (
          this.props.children
        )}
      </ErrorBoundaryContainer>
    );
  }
}

export default ErrorBoundary;
