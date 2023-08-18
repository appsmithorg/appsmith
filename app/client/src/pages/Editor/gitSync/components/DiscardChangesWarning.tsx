import React from "react";
import {
  createMessage,
  DISCARD_CHANGES_WARNING,
  DISCARD_MESSAGE,
} from "@appsmith/constants/messages";
import { Callout, Text } from "design-system";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function DiscardChangesWarning({
  onCloseDiscardChangesWarning,
}: any) {
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
            onClick: () => window.open(discardDocUrl, "_blank"),
            children: "Learn More",
            endIcon: "right-arrow",
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
