import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { setExplorerPinnedAction } from "actions/explorerActions";
import { createNewPageFromEntities } from "actions/pageActions";
import { getInstanceId } from "ee//selectors/tenantSelectors";
import { ADD_PAGE_TOOLTIP, createMessage } from "ee/constants/messages";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getExplorerStatus,
  saveExplorerStatus,
} from "ee/pages/Editor/Explorer/helpers";
import type { AppState } from "ee/reducers";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { selectAllPages } from "ee/selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getHasCreatePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { Page } from "entities/Page";
import { PageElement } from "pages/Editor/IDE/EditorPane/components/PageElement";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getExplorerPinned } from "selectors/explorerSelector";
import { getNextEntityName } from "utils/AppsmithUtils";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { EntityExplorerResizeHandler } from "../Common/EntityExplorerResizeHandler";
import {
  ENTITY_HEIGHT,
  RelativeContainer,
  StyledEntity,
} from "../Common/components";
import { EntityClassNames } from "../Entity";
import AddPageContextMenu from "./AddPageContextMenu";

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

  useEffect(() => {
    // scroll to the current page
    const currentPage = document.getElementById("entity-" + currentPageId);
    if (currentPage) {
      setTimeout(() => currentPage.scrollIntoView(), 0);
    }
  }, [currentPageId]);

  const [isMenuOpen, openMenu] = useState(false);

  const workspaceId = useSelector(getCurrentWorkspaceId);
  const instanceId = useSelector(getInstanceId);

  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );

    dispatch(
      createNewPageFromEntities(applicationId, name, workspaceId, instanceId),
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

  const pageElements = useMemo(
    () => pages.map((page) => <PageElement key={page.pageId} page={page} />),
    [pages, location.pathname],
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
