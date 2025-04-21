import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";

import type { Page } from "entities/Page";
import { defaultPageIcon, pageIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { ContextMenu } from "./ContextMenu";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { PERMISSION_TYPE, isPermitted } from "ee/utils/permissionHelpers";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { AppState } from "ee/reducers";
import { updatePageAction } from "actions/pageActions";
import { useGetPageFocusUrl } from "./hooks/useGetPageFocusUrl";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import history, { NavigationMethod } from "utils/history";
import { EntityItem } from "@appsmith/ads";
import { useNameEditorState } from "IDE/hooks/useNameEditorState";
import { useValidateEntityName } from "IDE";
import { noop } from "lodash";

export const PageEntity = ({
  onClick,
  page,
}: {
  page: Page;
  onClick?: () => void;
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigateToUrl = useGetPageFocusUrl(page.basePageId);
  const ref = useRef<null | HTMLDivElement>(null);

  const currentPageId = useSelector(getCurrentPageId);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const applicationId = useSelector(getCurrentApplicationId);
  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );

  const { editingEntity, enterEditMode, exitEditMode, updatingEntity } =
    useNameEditorState();
  const validateName = useValidateEntityName({
    entityName: page.pageName,
  });

  const icon = page.isDefault ? defaultPageIcon : pageIcon;
  const isCurrentPage = currentPageId === page.pageId;
  const pagePermissions = page.userPermissions;

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const hasExportPermission = isPermitted(
    userAppPermissions ?? [],
    PERMISSION_TYPE.EXPORT_APPLICATION,
  );

  useEffect(
    function scrollPageIntoView() {
      if (ref.current && isCurrentPage) {
        ref.current.scrollIntoView({
          inline: "nearest",
          block: "nearest",
        });
      }
    },
    [ref, isCurrentPage],
  );

  const handleEnterEditMode = () => {
    enterEditMode(page.pageId);
  };

  const handleDoubleClick = canManagePages ? handleEnterEditMode : noop;

  const switchPage = useCallback(() => {
    AnalyticsUtil.logEvent("PAGE_NAME_CLICK", {
      name: page.pageName,
      fromUrl: location.pathname,
      type: "PAGES",
      toUrl: navigateToUrl,
    });
    dispatch(toggleInOnboardingWidgetSelection(true));
    history.push(navigateToUrl, {
      invokedBy: NavigationMethod.EntityExplorer,
    });

    if (onClick) {
      onClick();
    }
  }, [location.pathname, navigateToUrl, dispatch, page.pageName, onClick]);

  const contextMenu = useMemo(
    () => (
      <ContextMenu
        applicationId={applicationId as string}
        hasExportPermission={hasExportPermission}
        isCurrentPage={isCurrentPage}
        isDefaultPage={page.isDefault}
        isHidden={!!page.isHidden}
        key={page.pageId + "_context-menu"}
        onItemSelected={onClick}
        pageId={page.pageId}
        pageName={page.pageName}
      />
    ),
    [
      applicationId,
      hasExportPermission,
      isCurrentPage,
      page.isDefault,
      page.isHidden,
      page.pageId,
      page.pageName,
      onClick,
    ],
  );

  const nameEditorConfig = useMemo(() => {
    return {
      canEdit: canManagePages,
      isEditing: editingEntity === page.pageId,
      isLoading: updatingEntity === page.pageId,
      onEditComplete: exitEditMode,
      onNameSave: (newName: string) =>
        dispatch(
          updatePageAction({
            id: page.pageId,
            name: newName,
            isHidden: !!page.isHidden,
          }),
        ),
      validateName: (newName: string) => validateName(newName),
      normalizeName: false,
    };
  }, [
    canManagePages,
    dispatch,
    editingEntity,
    exitEditMode,
    page,
    updatingEntity,
    validateName,
  ]);

  return (
    <EntityItem
      className={`page fullWidth ${isCurrentPage && "activePage"}`}
      id={page.pageId}
      isHidden={page.isHidden}
      isSelected={isCurrentPage}
      key={page.pageId}
      nameEditorConfig={nameEditorConfig}
      onClick={!isCurrentPage ? switchPage : noop}
      onDoubleClick={handleDoubleClick}
      rightControl={contextMenu}
      rightControlVisibility="hover"
      startIcon={icon}
      title={page.pageName}
    />
  );
};
