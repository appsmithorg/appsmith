import React from "react";
import { Button } from "design-system";
import { importSvg } from "design-system-old";
import { useSelector } from "react-redux";

import CardList from "pages/Applications/CardList";
import { PaddingWrapper } from "pages/Applications/CommonElements";
import {
  getIsCreatingApplicationByWorkspaceId,
  getIsFetchingApplications,
} from "@appsmith/selectors/applicationSelectors";
import { NoAppsFound } from "@appsmith/pages/Applications";
import ApplicationCard from "pages/Applications/ApplicationCard";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import type { UpdateApplicationPayload } from "@appsmith/api/ApplicationApi";
import {
  APPLICATION_CARD_LIST_ZERO_STATE,
  createMessage,
} from "@appsmith/constants/messages";

const NoAppsFoundIcon = importSvg(
  async () => import("assets/svg/no-apps-icon.svg"),
);

interface ApplicationCardListProps {
  applications: ApplicationPayload[];
  canInviteToWorkspace: boolean;
  enableImportExport: boolean;
  hasCreateNewApplicationPermission: boolean;
  hasManageWorkspacePermissions: boolean;
  isMobile?: boolean;
  workspaceId: string;
  onClickAddNewButton: (workspaceId: string) => void;
  deleteApplication: (applicationId: string) => void;
  updateApplicationDispatch: (
    id: string,
    data: UpdateApplicationPayload,
  ) => void;
}

function ApplicationCardList({
  applications,
  canInviteToWorkspace,
  deleteApplication,
  enableImportExport,
  hasCreateNewApplicationPermission,
  hasManageWorkspacePermissions,
  isMobile,
  onClickAddNewButton,
  updateApplicationDispatch,
  workspaceId,
}: ApplicationCardListProps) {
  const isCreatingApplication = Boolean(
    useSelector(getIsCreatingApplicationByWorkspaceId(workspaceId)),
  );
  const isFetchingApplications = useSelector(getIsFetchingApplications);

  return (
    <CardList
      isLoading={isFetchingApplications}
      isMobile={isMobile}
      title="Apps"
    >
      {applications.map((application: any) => {
        return (
          <PaddingWrapper isMobile={isMobile} key={application.id}>
            <ApplicationCard
              application={application}
              delete={deleteApplication}
              enableImportExport={enableImportExport}
              isFetchingApplications={isFetchingApplications}
              isMobile={isMobile}
              key={application.id}
              permissions={{
                hasCreateNewApplicationPermission,
                hasManageWorkspacePermissions,
                canInviteToWorkspace,
              }}
              update={updateApplicationDispatch}
              workspaceId={workspaceId}
            />
          </PaddingWrapper>
        );
      })}
      {applications.length === 0 && (
        <NoAppsFound>
          <NoAppsFoundIcon />
          <span>{createMessage(APPLICATION_CARD_LIST_ZERO_STATE)}</span>
          {/* below component is duplicate. This is because of cypress test were failing */}
          {hasCreateNewApplicationPermission && (
            <Button
              className="t--new-button createnew"
              isLoading={isCreatingApplication}
              onClick={() => onClickAddNewButton(workspaceId)}
              size="md"
              startIcon={"plus"}
            >
              New
            </Button>
          )}
        </NoAppsFound>
      )}
    </CardList>
  );
}

export default ApplicationCardList;
