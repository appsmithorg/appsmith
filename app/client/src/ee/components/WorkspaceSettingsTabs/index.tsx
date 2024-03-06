import React, { useMemo } from "react";
import { useRouteMatch, useLocation } from "react-router-dom";
import type { WorkspaceSettingsTabsProps } from "ce/components/WorkspaceSettingsTabs";
import {
  WorkspaceSettingsTabs as CE_WorkspaceSettingsTabs,
  SentryRoute,
} from "ce/components/WorkspaceSettingsTabs";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { ManageEnvironments } from "./ManageEnvironments";
import { allowManageEnvironmentAccessForWorkspace } from "@appsmith/selectors/environmentSelectors";

enum TABS {
  ENVIRONMENTS = "environments",
}

export const WorkspaceSettingsTabs = (props: WorkspaceSettingsTabsProps) => {
  const { path } = useRouteMatch();
  const location = useLocation();

  const hasWorkspaceManageEnvPermission = useSelector((state: AppState) =>
    allowManageEnvironmentAccessForWorkspace(
      state,
      props.workspacePermissions || [],
    ),
  );

  const redirectToApplications = useMemo(() => {
    if (!props.workspacePermissions) {
      return false;
    }

    return (
      props.currentTab === TABS.ENVIRONMENTS && !hasWorkspaceManageEnvPermission
    );
  }, [
    hasWorkspaceManageEnvPermission,
    props.currentTab,
    props.workspacePermissions,
  ]);

  const ManageEnvComponent = (
    <SentryRoute
      component={ManageEnvironments}
      location={location}
      path={`${path}/environments`}
    />
  );

  const addTabComponent = () => {
    return {
      key: "environments",
      title: "Environments",
      panelComponent: ManageEnvComponent,
    };
  };

  return (
    <CE_WorkspaceSettingsTabs
      {...props}
      addTabComponent={
        hasWorkspaceManageEnvPermission ? addTabComponent : undefined
      }
      eeTabRedirect={redirectToApplications}
    />
  );
};
