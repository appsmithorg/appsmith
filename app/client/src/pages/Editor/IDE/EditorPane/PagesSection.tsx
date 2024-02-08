import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Text } from "design-system";
import { animated, useSpring } from "react-spring";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";

import { selectAllPages } from "@appsmith/selectors/entitiesSelector";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import { getHasCreatePagePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import type { AppState } from "@appsmith/reducers";
import { createNewPageFromEntities } from "actions/pageActions";
import { setIdeEditorPagesActiveStatus } from "actions/ideActions";
import AddPageContextMenu from "pages/Editor/Explorer/Pages/AddPageContextMenu";
import { getNextEntityName } from "utils/AppsmithUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { PageElement } from "pages/Editor/IDE/EditorPane/components/PageElement";

const AnimatedFlex = animated(Flex);

const PagesSection = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const pages: Page[] = useSelector(selectAllPages);
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

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  useEffect(() => {
    api.start();
  }, []);

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
    () => pages.map((page) => <PageElement key={page.pageId} page={page} />),
    [pages, location.pathname],
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
