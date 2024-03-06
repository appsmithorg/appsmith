import React from "react";
import { Text } from "design-system";

import {
  ResourceHeading,
  CardListWrapper,
  PaddingWrapper,
  CardListContainer,
  Space,
} from "pages/Applications/CommonElements";
import { NoAppsFound } from "@appsmith/pages/Applications";
import {
  EMPTY_WORKFLOW_LIST,
  createMessage,
} from "@appsmith/constants/messages";
import WorkflowCard from "./WorkflowCard";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

export interface WorkflowCardListRendererProps {
  isFetchingWorkflows?: boolean;
  isMobile: boolean;
  workflows?: Workflow[];
  workspaceId: string;
}

function WorkflowCardListRenderer({
  isFetchingWorkflows = false,
  isMobile,
  workflows = [],
  workspaceId,
}: WorkflowCardListRendererProps) {
  return (
    <CardListContainer isMobile={isMobile}>
      <ResourceHeading isLoading={isFetchingWorkflows}>
        Workflows
      </ResourceHeading>
      <Space />
      <CardListWrapper isMobile={isMobile} key={workspaceId}>
        {workflows.map((workflow: any) => {
          return (
            <PaddingWrapper isMobile={isMobile} key={workflow.id}>
              <WorkflowCard
                isFetchingWorkflows={isFetchingWorkflows}
                isMobile={isMobile}
                key={workflow.id}
                workflow={workflow}
                workspaceId={workspaceId}
              />
            </PaddingWrapper>
          );
        })}
        {workflows.length === 0 && (
          <NoAppsFound>
            <img
              className="mb-7"
              src={getAssetUrl(`${ASSETS_CDN_URL}/no-packages.svg`)}
            />
            <Text kind="heading-xs">{createMessage(EMPTY_WORKFLOW_LIST)}</Text>
          </NoAppsFound>
        )}
      </CardListWrapper>
    </CardListContainer>
  );
}

export default WorkflowCardListRenderer;
