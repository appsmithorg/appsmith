import React from "react";
import {
  createMessage,
  DISCARD_CHANGES_WARNING,
  DISCARD_MESSAGE,
} from "ee/constants/messages";
import { Callout, Text } from "@appsmith/ads";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function DiscardChangesWarning({
  onCloseDiscardChangesWarning,
}: {
  onCloseDiscardChangesWarning: () => void;
}) {
  const discardDocUrl =
    "https://docs.appsmith.com/advanced-concepts/version-control-with-git/commit-and-push";

  return (
    <Container>
      <Callout
        data-testid="t--discard-callout"
        isClosable
        kind="error"
        links={[
          {
            children: "Learn more",
            endIcon: "right-arrow",
            to: discardDocUrl,
            target: "_blank",
          },
        ]}
        onClose={onCloseDiscardChangesWarning}
      >
        <Text kind="heading-xs">{createMessage(DISCARD_CHANGES_WARNING)}</Text>
        <br />
        {createMessage(DISCARD_MESSAGE)}
      </Callout>
    </Container>
  );
}
