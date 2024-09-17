import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  getConnectingErrorDocUrl,
  getGitConnectError,
} from "selectors/gitSyncSelectors";
import { Callout, Text } from "@appsmith/ads";
import styled from "styled-components";

const Container = styled.div`
  width: calc(100% - 39px);

  & .t--git-connection-error > .ads-v2-callout__children {
    margin-top: 0;
  }
`;

export default function GitConnectError({
  onClose,
  onDisplay,
}: {
  onClose?: () => void;
  onDisplay?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const error = useSelector(getGitConnectError);
  const connectingErrorDocumentUrl = useSelector(getConnectingErrorDocUrl);
  const titleMessage = error?.errorType
    ? error.errorType.replaceAll("_", " ")
    : "";

  useEffect(() => {
    if (error && onDisplay) {
      onDisplay();
    }
    if (containerRef.current) {
      containerRef.current.scrollIntoView();
    }
  }, [error]);

  return error ? (
    <Container ref={containerRef}>
      <Callout
        className="t--git-connection-error error"
        isClosable
        kind="error"
        links={[
          {
            children: "Learn more",
            target: "_blank",
            to: connectingErrorDocumentUrl,
          },
        ]}
        onClose={onClose}
      >
        <Text kind="heading-s" style={{ marginBottom: "8px" }}>
          {titleMessage}
        </Text>
        <br />
        <Text kind="body-m" style={{ marginBottom: "8px" }}>
          {error?.message}
        </Text>
      </Callout>
    </Container>
  ) : null;
}
