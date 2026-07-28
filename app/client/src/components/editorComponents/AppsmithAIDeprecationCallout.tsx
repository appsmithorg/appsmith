import React from "react";
import styled from "styled-components";
import { Callout } from "@appsmith/ads";
import { DocsLink, openDoc } from "constants/DocumentationLinks";
import {
  APPSMITH_AI_DEPRECATION_LEARN_MORE,
  APPSMITH_AI_DEPRECATION_MESSAGE,
  createMessage,
} from "ee/constants/messages";

const CalloutWrapper = styled.div`
  width: 100%;
  margin-bottom: var(--ads-v2-spaces-4);
`;

/**
 * Deprecation notice for the managed Appsmith AI plugin (release 2.3).
 * Shown on existing Appsmith AI datasources and queries; creating new
 * Appsmith AI datasources is blocked separately (client filter + server guard).
 */
function AppsmithAIDeprecationCallout() {
  return (
    <CalloutWrapper data-testid="t--appsmith-ai-deprecation-callout">
      <Callout
        kind="warning"
        links={[
          {
            children: createMessage(APPSMITH_AI_DEPRECATION_LEARN_MORE),
            onClick: () => openDoc(DocsLink.APPSMITH_AI_DEPRECATION),
          },
        ]}
      >
        {createMessage(APPSMITH_AI_DEPRECATION_MESSAGE)}
      </Callout>
    </CalloutWrapper>
  );
}

export default AppsmithAIDeprecationCallout;
