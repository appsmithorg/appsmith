import React from "react";
import styled from "styled-components";

import type { ReactNode, CSSProperties } from "react";
import { faro } from "instrumentation";

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

const ErrorBoundaryContainer = styled.div`
  height: 100%;
  width: 100%;
`;

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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidCatch(error: any, errorInfo: any) {
    faro?.api.pushError(
      { ...error, name: "ErrorBoundary" },
      { type: "error", context: errorInfo },
    );
  }

  render() {
    return (
      <ErrorBoundaryContainer
        className="error-boundary"
        style={this.props.style}
      >
        {this.state.hasError
          ? this.props.fallback || (
              <p>
                Oops, Something went wrong.
                <br />
                <RetryLink onClick={() => this.setState({ hasError: false })}>
                  Click here to retry
                </RetryLink>
              </p>
            )
          : this.props.children}
      </ErrorBoundaryContainer>
    );
  }
}

export default ErrorBoundary;
