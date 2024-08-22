import React from "react";

import {
  DISCARD_CHANGES_WARNING,
  DISCARD_MESSAGE,
  createMessage,
} from "ee/constants/messages";
import styled from "styled-components";

import { Callout, Text } from "@appsmith/ads";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function DiscardChangesWarning({
  onCloseDiscardChangesWarning, // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
