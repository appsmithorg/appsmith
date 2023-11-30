import React, { useRef, useEffect, useCallback } from "react";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useDispatch, useSelector } from "react-redux";
import Datasources from "pages/Editor/Explorer/Datasources";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { EntityExplorerWrapper } from "pages/Editor/Explorer/Common/EntityExplorerWrapper";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import { getExplorerStatus, saveExplorerStatus } from "../Explorer/helpers";
import { INTEGRATION_TABS } from "constants/routes";
import { getCurrentModuleId } from "@appsmith/selectors/modulesSelector";
import history from "utils/history";
import { integrationEditorURL } from "@appsmith/RouteBuilder";

// ankita: update this component to not use datasources anymore and add private entities
function PackageEntityExplorer({ isActive }: { isActive: boolean }) {
  const dispatch = useDispatch();
  PerformanceTracker.startTracking(PerformanceTransactionName.ENTITY_EXPLORER);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId]);

  const packageId = useSelector(getCurrentPackageId) || "";
  const moduleId = useSelector(getCurrentModuleId);

  const isDatasourcesOpen = getExplorerStatus(packageId, "datasource");

  const addDatasource = useCallback(() => {
    history.push(
      integrationEditorURL({
        pageId: packageId, // ankita: update later
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
  }, [moduleId]);

  const listDatasource = useCallback(() => {
    history.push(
      integrationEditorURL({
        pageId: packageId, // ankita: update later
        selectedTab: INTEGRATION_TABS.ACTIVE,
      }),
    );
  }, [moduleId]);

  const onDatasourcesToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(packageId, "datasource", isOpen);
    },
    [packageId],
  );

  return (
    <EntityExplorerWrapper explorerRef={explorerRef} isActive={isActive}>
      <Datasources
        addDatasource={addDatasource}
        entityId={moduleId}
        isDatasourcesOpen={isDatasourcesOpen}
        listDatasource={listDatasource}
        onDatasourcesToggle={onDatasourcesToggle}
      />
    </EntityExplorerWrapper>
  );
}

PackageEntityExplorer.displayName = "PackageEntityExplorer";

export default PackageEntityExplorer;
