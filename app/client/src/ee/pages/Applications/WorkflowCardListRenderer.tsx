import React from "react";
import styled from "styled-components";
import { Button, Icon } from "design-system";

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

export interface WorkflowCardListRendererProps {
  createWorkflow: () => void;
  isCreatingWorkflow?: boolean;
  isFetchingWorkflows?: boolean;
  isMobile: boolean;
  workflows?: Workflow[];
  workspaceId: string;
}

const NotFoundIcon = styled(Icon)`
  && {
    margin-bottom: var(--ads-v2-spaces-3);
  }

  & svg {
    color: var(--ads-v2-color-gray-400);
    height: var(--ads-v2-spaces-11);
    width: var(--ads-v2-spaces-11);
  }
`;

function WorkflowCardListRenderer({
  createWorkflow,
  isCreatingWorkflow = false,
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
            <NotFoundIcon name="workflow" size="lg" />
            <span>{createMessage(EMPTY_WORKFLOW_LIST)}</span>
            <Button
              className="t--new-workflow-button createnew"
              isLoading={isCreatingWorkflow}
              onClick={createWorkflow}
              size="md"
              startIcon="plus"
            >
              New
            </Button>
          </NoAppsFound>
        )}
      </CardListWrapper>
    </CardListContainer>
  );
}

export default WorkflowCardListRenderer;
