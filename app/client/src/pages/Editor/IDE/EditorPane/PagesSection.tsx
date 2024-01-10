import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Text } from "design-system";
import { animated, useSpring } from "react-spring";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";

import {
  getCurrentPageId,
  selectAllPages,
} from "@appsmith/selectors/entitiesSelector";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import PageContextMenu from "pages/Editor/Explorer/Pages/PageContextMenu";
import { StyledEntity } from "pages/Editor/Explorer/Common/components";
import { defaultPageIcon, pageIcon } from "pages/Editor/Explorer/ExplorerIcons";
import {
  getHasCreatePagePermission,
  getHasManagePagePermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import type { AppState } from "@appsmith/reducers";
import { builderURL, widgetListURL } from "@appsmith/RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import history, { NavigationMethod } from "utils/history";
import { resolveAsSpaceChar } from "utils/helpers";
import { createNewPageFromEntities, updatePage } from "actions/pageActions";
import { setIdeEditorPagesActiveStatus } from "actions/ideActions";
import AddPageContextMenu from "pages/Editor/Explorer/Pages/AddPageContextMenu";
import { getNextEntityName } from "utils/AppsmithUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";

const AnimatedFlex = animated(Flex);

const PagesSection = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const pages: Page[] = useSelector(selectAllPages);
  const currentPageId = useSelector(getCurrentPageId);
  const applicationId = useSelector(getCurrentApplicationId);
  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const instanceId = useSelector(getInstanceId);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const [springs, api] = useSpring(() => ({
    from: { opacity: 0, height: "0%" },
    to: { opacity: 1, height: "100%" },
  }));

  const hasExportPermission = isPermitted(
    userAppPermissions ?? [],
    PERMISSION_TYPE.EXPORT_APPLICATION,
  );

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  useEffect(() => {
    api.start();
  }, []);

  const switchPage = useCallback(
    (page: Page) => {
      const navigateToUrl =
        currentPageId === page.pageId
          ? widgetListURL({})
          : builderURL({
              pageId: page.pageId,
            });
      AnalyticsUtil.logEvent("PAGE_NAME_CLICK", {
        name: page.pageName,
        fromUrl: location.pathname,
        type: "PAGES",
        toUrl: navigateToUrl,
      });
      dispatch(toggleInOnboardingWidgetSelection(true));
      dispatch(setIdeEditorPagesActiveStatus(false));
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EntityExplorer,
      });
    },
    [location.pathname, currentPageId],
  );

  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );
    dispatch(setIdeEditorPagesActiveStatus(false));
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

  const onMenuClose = useCallback(() => setIsMenuOpen(false), [setIsMenuOpen]);

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
            className={`page fullWidth ${isCurrentPage && "activePage"}`}
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
    <AnimatedFlex
      flexDirection={"column"}
      height={"calc(100% - 36px)"} // 36px is the height of the minimal segment
      justifyContent={"center"}
      overflow={"hidden"}
      style={springs}
    >
      <Flex
        alignItems={"center"}
        background={"var(--ads-v2-color-bg-subtle)"}
        borderBottom={"1px solid var(--ads-v2-color-border)"}
        flexDirection={"row"}
        justifyContent={"space-between"}
        p="spaces-2"
        pl="spaces-3"
        width={"100%"}
      >
        <Text isBold kind={"body-m"}>
          All Pages ({pages.length})
        </Text>
        {canCreatePages ? (
          <AddPageContextMenu
            className={`${EntityClassNames.ADD_BUTTON} group pages`}
            createPageCallback={createPageCallback}
            onMenuClose={onMenuClose}
            openMenu={isMenuOpen}
          />
        ) : null}
      </Flex>
      <Flex
        alignItems={"center"}
        flex={"1"}
        flexDirection={"column"}
        width={"100%"}
      >
        {pageElements}
      </Flex>
    </AnimatedFlex>
  );
};

export { PagesSection };
