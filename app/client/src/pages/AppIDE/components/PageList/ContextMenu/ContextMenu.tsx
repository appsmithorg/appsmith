import React from "react";
import { EntityContextMenu, MenuSeparator } from "@appsmith/ads";
import { Rename } from "./Rename";
import { Clone } from "./Clone";
import { Visibility } from "./Visibility";
import { SetAsHomePage } from "./SetAsHomePage";
import { Delete } from "./Delete";
import { PartialExport } from "./PartialExport";
import { PartialImport } from "./PartialImport";
import {
  getHasManagePagePermission,
  getHasCreatePagePermission,
  getHasDeletePagePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getPageById } from "selectors/editorSelectors";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";

interface Props {
  pageId: string;
  pageName: string;
  applicationId: string;
  isCurrentPage: boolean;
  isDefaultPage: boolean;
  isHidden: boolean;
  hasExportPermission: boolean;
  onItemSelected?: () => void;
}

export const ContextMenu = (props: Props) => {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const pagePermissions =
    useSelector(getPageById(props.pageId))?.userPermissions || [];

  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  const canDeletePages = getHasDeletePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const showPartialImportExport =
    props.hasExportPermission && props.isCurrentPage;

  return (
    <EntityContextMenu dataTestid={EntityClassNames.CONTEXT_MENU}>
      <Rename disabled={!canManagePages} pageId={props.pageId} />
      <MenuSeparator />
      <Clone
        disabled={!canCreatePages || !canManagePages}
        pageId={props.pageId}
      />
      <Visibility
        disabled={!canManagePages}
        isHidden={props.isHidden}
        pageId={props.pageId}
        pageName={props.pageName}
      />
      <SetAsHomePage
        applicationId={props.applicationId}
        disabled={!canManagePages || props.isDefaultPage}
        pageId={props.pageId}
      />
      {showPartialImportExport && (
        <>
          <MenuSeparator />
          <PartialExport
            disabled={!props.hasExportPermission}
            onItemSelected={props.onItemSelected}
          />
          <PartialImport
            disabled={!props.hasExportPermission}
            onItemSelected={props.onItemSelected}
          />
        </>
      )}
      <MenuSeparator />
      <Delete
        disabled={!canDeletePages || props.isDefaultPage}
        pageId={props.pageId}
        pageName={props.pageName}
      />
    </EntityContextMenu>
  );
};
