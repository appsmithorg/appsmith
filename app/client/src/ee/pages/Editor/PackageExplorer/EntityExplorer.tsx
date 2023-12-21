import React, { useRef, useEffect } from "react";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useDispatch, useSelector } from "react-redux";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { EntityExplorerWrapper } from "pages/Editor/Explorer/Common/EntityExplorerWrapper";
import {
  ActionEntityContextMenuItemsEnum,
  FilesContextProvider,
} from "pages/Editor/Explorer/Files/FilesContextProvider";
import { ACTION_PARENT_ENTITY_TYPE } from "@appsmith/entities/Engine/actionHelpers";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import { getCurrentModule } from "@appsmith/selectors/modulesSelector";
import Files from "pages/Editor/Explorer/Files";
import { selectFilesForPackageExplorer } from "@appsmith/selectors/entitiesSelector";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

function PackageEntityExplorer({ isActive }: { isActive: boolean }) {
  const dispatch = useDispatch();
  PerformanceTracker.startTracking(PerformanceTransactionName.ENTITY_EXPLORER);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const packageId = useSelector(getCurrentPackageId) || "";
  const module = useSelector(getCurrentModule);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId]);

  return (
    <EntityExplorerWrapper explorerRef={explorerRef} isActive={isActive}>
      {module && module.type === MODULE_TYPE.JS && (
        <FilesContextProvider
          canCreateActions
          editorId={packageId}
          menuItems={[
            ActionEntityContextMenuItemsEnum.EDIT_NAME,
            ActionEntityContextMenuItemsEnum.DELETE,
          ]}
          parentEntityId={module.id}
          parentEntityType={ACTION_PARENT_ENTITY_TYPE.PACKAGE}
          selectFilesForExplorer={selectFilesForPackageExplorer}
          showModules={false}
        >
          <Files />
        </FilesContextProvider>
      )}
    </EntityExplorerWrapper>
  );
}

PackageEntityExplorer.displayName = "PackageEntityExplorer";

export default PackageEntityExplorer;
