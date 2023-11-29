import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { EntityClassNames } from "../Entity";
import history, { NavigationMethod } from "utils/history";
import { createNewPageFromEntities, updatePage } from "actions/pageActions";
import { defaultPageIcon, pageIcon } from "../ExplorerIcons";
import { ADD_PAGE_TOOLTIP, createMessage } from "@appsmith/constants/messages";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import { getNextEntityName } from "utils/AppsmithUtils";
import PageContextMenu from "./PageContextMenu";
import { resolveAsSpaceChar } from "utils/helpers";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinnedAction } from "actions/explorerActions";
import { selectAllPages } from "@appsmith/selectors/entitiesSelector";
import { builderURL } from "@appsmith/RouteBuilder";
import {
  getExplorerStatus,
  saveExplorerStatus,
} from "@appsmith/pages/Editor/Explorer/helpers";
import AddPageContextMenu from "./AddPageContextMenu";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import type { AppState } from "@appsmith/reducers";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getInstanceId } from "@appsmith//selectors/tenantSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasCreatePagePermission,
  getHasManagePagePermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import {
  ENTITY_HEIGHT,
  RelativeContainer,
  StyledEntity,
} from "../Common/components";
import { EntityExplorerResizeHandler } from "../Common/EntityExplorerResizeHandler";
import {
  PERMISSION_TYPE,
  isPermitted,
} from "@appsmith/utils/permissionHelpers";

function Pages() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pages: Page[] = useSelector(selectAllPages);
  const currentPageId = useSelector(getCurrentPageId);
  const pinned = useSelector(getExplorerPinned);
  const dispatch = useDispatch();
  const isPagesOpen = getExplorerStatus(applicationId, "pages");
  const pageResizeRef = useRef<HTMLDivElement>(null);
  const storedHeightKey = "pagesContainerHeight_" + applicationId;
  const storedHeight = localStorage.getItem(storedHeightKey);
  const location = useLocation();

  useEffect(() => {
    if ((isPagesOpen === null ? true : isPagesOpen) && pageResizeRef.current) {
      pageResizeRef.current.style.height = storedHeight + "px";
    }
  }, [pageResizeRef]);

  const switchPage = useCallback(
    (page: Page) => {
      const navigateToUrl = builderURL({
        pageId: page.pageId,
      });
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
    },
    [location.pathname],
  );

  const [isMenuOpen, openMenu] = useState(false);

  const workspaceId = useSelector(getCurrentWorkspaceId);
  const instanceId = useSelector(getInstanceId);

  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );

    dispatch(
      createNewPageFromEntities(
        applicationId,
        name,
        workspaceId,
        false,
        instanceId,
      ),
    );
  }, [dispatch, pages, applicationId]);

  const onMenuClose = useCallback(() => openMenu(false), [openMenu]);

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinnedAction(!pinned));
  }, [pinned, dispatch, setExplorerPinnedAction]);

  const onPageToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(applicationId, "pages", isOpen);
    },
    [applicationId],
  );

  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );
  const hasExportPermission = isPermitted(
    userAppPermissions ?? [],
    PERMISSION_TYPE.EXPORT_APPLICATION,
  );

  const pageElements = useMemo(
    () =>
      pages.map((page) => {
        const icon = page.isDefault ? defaultPageIcon : pageIcon;
        const isCurrentPage = currentPageId === page.pageId;
        const pagePermissions = page.userPermissions;
        const canManagePages = getHasManagePagePermission(
          isFeatureEnabled,
          pagePermissions,
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
            pageId={page.pageId}
          />
        );

        return (
          <StyledEntity
            action={() => switchPage(page)}
            active={isCurrentPage}
            canEditEntityName={canManagePages}
            className={`page ${isCurrentPage && "activePage"}`}
            contextMenu={contextMenu}
            disabled={page.isHidden}
            entityId={page.pageId}
            icon={icon}
            isDefaultExpanded={isCurrentPage}
            key={page.pageId}
            name={page.pageName}
            onNameEdit={resolveAsSpaceChar}
            searchKeyword={""}
            step={1}
            updateEntityName={(id, name) =>
              updatePage({ id, name, isHidden: !!page.isHidden })
            }
          />
        );
      }),
    [pages, currentPageId, applicationId, location.pathname],
  );

  return (
    <RelativeContainer className="border-b pb-1">
      <StyledEntity
        addButtonHelptext={createMessage(ADD_PAGE_TOOLTIP)}
        alwaysShowRightIcon
        className="pb-0 group pages"
        collapseRef={pageResizeRef}
        customAddButton={
          <AddPageContextMenu
            className={`${EntityClassNames.ADD_BUTTON} group pages`}
            createPageCallback={createPageCallback}
            onMenuClose={onMenuClose}
            openMenu={isMenuOpen}
          />
        }
        entityId="Pages"
        entitySize={ENTITY_HEIGHT * pages.length}
        icon={""}
        isDefaultExpanded={
          isPagesOpen === null || isPagesOpen === undefined ? true : isPagesOpen
        }
        name="Pages"
        onClickPreRightIcon={onPin}
        onToggle={onPageToggle}
        searchKeyword={""}
        showAddButton={canCreatePages}
        step={0}
      >
        {pageElements}
      </StyledEntity>
      <EntityExplorerResizeHandler
        resizeRef={pageResizeRef}
        storedHeightKey={storedHeightKey}
      />
    </RelativeContainer>
  );
}

Pages.displayName = "Pages";

export default React.memo(Pages);
