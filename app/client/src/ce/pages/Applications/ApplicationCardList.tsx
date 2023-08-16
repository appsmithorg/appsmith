import React from "react";
import styled from "styled-components";

import ApplicationCard from "pages/Applications/ApplicationCard";
import { Button } from "design-system";
import { importSvg } from "design-system-old";
import { NoAppsFound } from "@appsmith/pages/Applications";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import type { UpdateApplicationPayload } from "@appsmith/api/ApplicationApi";

const NoAppsFoundIcon = importSvg(() => import("assets/svg/no-apps-icon.svg"));

type ApplicationCardListProps = {
  applications: ApplicationPayload[];
  canInviteToWorkspace: boolean;
  enableImportExport: boolean;
  hasCreateNewApplicationPermission: boolean;
  hasManageWorkspacePermissions: boolean;
  isCreatingApplication: boolean;
  isMobile?: boolean;
  workspace: Workspace;
  onClickAddNewButton: (workspaceId: string) => void;
  deleteApplication: (applicationId: string) => void;
  updateApplicationDispatch: (
    id: string,
    data: UpdateApplicationPayload,
  ) => void;
};

export const ApplicationCardsWrapper = styled.div<{ isMobile?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ isMobile }) => (isMobile ? 12 : 20)}px;
  font-size: ${(props) => props.theme.fontSizes[4]}px;
  padding: ${({ isMobile }) => (isMobile ? `10px 16px` : `10px 0`)};
`;

export const PaddingWrapper = styled.div<{ isMobile?: boolean }>`
  display: flex;
  align-items: baseline;
  justify-content: center;
  width: ${(props) => props.theme.card.minWidth}px;

  @media screen and (min-width: 1500px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth}px;
      height: ${(props) => props.theme.card.minHeight}px;
    }
  }

  @media screen and (min-width: 1500px) and (max-width: 1512px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 5}px;
      height: ${(props) => props.theme.card.minHeight - 5}px;
    }
  }
  @media screen and (min-width: 1478px) and (max-width: 1500px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 8}px;
      height: ${(props) => props.theme.card.minHeight - 8}px;
    }
  }

  @media screen and (min-width: 1447px) and (max-width: 1477px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[3] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 8}px;
      height: ${(props) => props.theme.card.minHeight - 8}px;
    }
  }

  @media screen and (min-width: 1417px) and (max-width: 1446px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[3] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 11}px;
      height: ${(props) => props.theme.card.minHeight - 11}px;
    }
  }

  @media screen and (min-width: 1400px) and (max-width: 1417px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[2] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 15}px;
      height: ${(props) => props.theme.card.minHeight - 15}px;
    }
  }

  @media screen and (max-width: 1400px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[2] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 15}px;
      height: ${(props) => props.theme.card.minHeight - 15}px;
    }
  }

  ${({ isMobile }) =>
    isMobile &&
    `
    width: 100% !important;
  `}
`;

function ApplicationCardList({
  applications,
  canInviteToWorkspace,
  deleteApplication,
  enableImportExport,
  hasCreateNewApplicationPermission,
  hasManageWorkspacePermissions,
  isCreatingApplication,
  isMobile,
  onClickAddNewButton,
  updateApplicationDispatch,
  workspace,
}: ApplicationCardListProps) {
  return (
    <ApplicationCardsWrapper isMobile={isMobile} key={workspace.id}>
      {applications.map((application: any) => {
        return (
          <PaddingWrapper isMobile={isMobile} key={application.id}>
            <ApplicationCard
              application={application}
              delete={deleteApplication}
              enableImportExport={enableImportExport}
              isMobile={isMobile}
              key={application.id}
              permissions={{
                hasCreateNewApplicationPermission,
                hasManageWorkspacePermissions,
                canInviteToWorkspace,
              }}
              update={updateApplicationDispatch}
              workspaceId={workspace.id}
            />
          </PaddingWrapper>
        );
      })}
      {applications.length === 0 && (
        <NoAppsFound>
          <NoAppsFoundIcon />
          <span>There’s nothing inside this workspace</span>
          {/* below component is duplicate. This is because of cypress test were failing */}
          {hasCreateNewApplicationPermission && (
            <Button
              className="t--new-button createnew"
              isLoading={isCreatingApplication}
              onClick={() => onClickAddNewButton(workspace.id)}
              size="md"
              startIcon={"plus"}
            >
              New
            </Button>
          )}
        </NoAppsFound>
      )}
    </ApplicationCardsWrapper>
  );
}

export default ApplicationCardList;
