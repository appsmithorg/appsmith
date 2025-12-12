import React from "react";
import { createMessage, REDEPLOY_WARNING_MESSAGE } from "ee/constants/messages";
import { Callout, Text } from "@appsmith/ads";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function RedeployWarning() {
  const redeployDocUrl =
    "https://docs.appsmith.com/advanced-concepts/version-control-with-git/commit-and-push";

  return (
    <Container>
      <Callout
        data-testid="t--git-ops-redeploy-warning-callout"
        kind="warning"
        links={[
          {
            children: "Learn more",
            endIcon: "right-arrow",
            to: redeployDocUrl,
            target: "_blank",
          },
        ]}
      >
        <Text kind="heading-xs">{createMessage(REDEPLOY_WARNING_MESSAGE)}</Text>
      </Callout>
    </Container>
  );
}
