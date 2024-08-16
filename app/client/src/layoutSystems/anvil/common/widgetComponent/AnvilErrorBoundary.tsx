import styled from "styled-components";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";

const RetryLink = styled.span`
  color: ${(props) => props.theme.colors.primaryDarkest};
  cursor: pointer;
`;

export class AnvilErrorBoundary extends ErrorBoundary {
  render() {
    return this.state.hasError ? (
      <p>
        Something went wrong.
        <br />
        <RetryLink onClick={() => this.setState({ hasError: false })}>
          Click here to retry
        </RetryLink>
      </p>
    ) : (
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.props.children as any)
    );
  }
}
