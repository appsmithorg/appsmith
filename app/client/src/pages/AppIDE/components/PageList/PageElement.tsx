import React, { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";

import type { Page } from "entities/Page";
import { defaultPageIcon, pageIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import PageContextMenu from "./PageContextMenu";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { PERMISSION_TYPE, isPermitted } from "ee/utils/permissionHelpers";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { AppState } from "ee/reducers";
import { StyledEntity } from "pages/Editor/Explorer/Common/components";
import { toValidPageName } from "utils/helpers";
import { updatePageAction } from "actions/pageActions";
import { useGetPageFocusUrl } from "./hooks/useGetPageFocusUrl";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import history, { NavigationMethod } from "utils/history";

const PageElement = ({
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

  useEffect(() => {
    if (ref.current && isCurrentPage) {
      ref.current.scrollIntoView({
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [ref, isCurrentPage]);

  const switchPage = useCallback(
    (page: Page) => {
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
    },
    [location.pathname, currentPageId, navigateToUrl],
  );

  const contextMenu = (
    <PageContextMenu
      applicationId={applicationId as string}
      className={EntityClassNames.CONTEXT_MENU}
      hasExportPermission={hasExportPermission}
      isCurrentPage={isCurrentPage}
      isDefaultPage={page.isDefault}
      isHidden={!!page.isHidden}
      key={page.pageId + "_context-menu"}
      name={page.pageName}
      onItemSelected={onClick}
      pageId={page.pageId}
    />
  );

  return (
    <StyledEntity
      action={() => switchPage(page)}
      active={isCurrentPage}
      canEditEntityName={canManagePages}
      className={`page fullWidth ${isCurrentPage && "activePage"}`}
      contextMenu={contextMenu}
      disabled={page.isHidden}
      entityId={page.pageId}
      icon={icon}
      isDefaultExpanded={isCurrentPage}
      key={page.pageId}
      name={page.pageName}
      onNameEdit={toValidPageName}
      ref={ref}
      searchKeyword={""}
      step={0}
      updateEntityName={(id, name) =>
        updatePageAction({ id, name, isHidden: !!page.isHidden })
      }
    />
  );
};

export { PageElement };
