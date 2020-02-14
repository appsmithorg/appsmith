import React from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/browser";

type Props = {};
type State = { hasError: boolean };

const RetryLink = styled.span`
  color: ${props => props.theme.colors.primaryDarkest};
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
    console.error({ error, errorInfo });
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <p>
          Oops, Something went wrong.
          <br />
          <RetryLink onClick={() => this.setState({ hasError: false })}>
            Click here to retry
          </RetryLink>
        </p>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
