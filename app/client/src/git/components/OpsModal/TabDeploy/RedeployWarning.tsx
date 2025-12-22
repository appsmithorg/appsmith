import React from "react";
import { createMessage } from "ee/constants/messages";
import {
  REDEPLOY_WARNING_MESSAGE,
  REDEPLOY_DOC_URL,
  type RedeployTriggerValue,
} from "ee/constants/DeploymentConstants";
import { Callout, Text } from "@appsmith/ads";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

interface RedeployWarningProps {
  redeployTrigger: RedeployTriggerValue | null;
}

const RedeployWarning: React.FC<RedeployWarningProps> = ({
  redeployTrigger,
}) => {
  if (!redeployTrigger) {
    return null;
  }

  return (
    <Container>
      <Callout
        data-testid="t--git-ops-redeploy-warning-callout"
        kind="warning"
        links={[
          {
            children: "Learn more",
            endIcon: "right-arrow",
            to: REDEPLOY_DOC_URL[redeployTrigger],
            target: "_blank",
          },
        ]}
      >
        <Text kind="heading-xs">
          {createMessage(REDEPLOY_WARNING_MESSAGE[redeployTrigger])}
        </Text>
      </Callout>
    </Container>
  );
};

export default RedeployWarning;
