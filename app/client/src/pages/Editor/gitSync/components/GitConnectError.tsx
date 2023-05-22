import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  getConnectingErrorDocUrl,
  getGitConnectError,
} from "selectors/gitSyncSelectors";
import { Callout, Text } from "design-system";
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
  const error = useSelector(getGitConnectError);
  const connectingErrorDocumentUrl = useSelector(getConnectingErrorDocUrl);
  const titleMessage = error?.errorType
    ? error.errorType.replaceAll("_", " ")
    : "";

  useEffect(() => {
    if (error && onDisplay) {
      onDisplay();
    }
  }, [error]);

  const learnMoreClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(connectingErrorDocumentUrl, "_blank");
  };

  return error ? (
    <Container>
      <Callout
        className="t--git-connection-error error"
        isClosable
        kind="error"
        links={[
          {
            children: "Learn More",
            onClick: learnMoreClickHandler,
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
