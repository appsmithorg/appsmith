import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { animated, useSpring } from "react-spring";

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
import AddPageContextMenu from "pages/Editor/Explorer/Pages/AddPageContextMenu";
import { getNextEntityName } from "utils/AppsmithUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { PageElement } from "pages/Editor/IDE/EditorPane/components/PageElement";
import { getPagesActiveStatus } from "selectors/ideSelectors";
import PaneHeader from "../LeftPane/PaneHeader";

const AnimatedFlex = animated(Flex);
const defaultAnimationState = { height: "0%" };
const expandedAnimationState = { height: "21.5%" };

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
  const pagesActive = useSelector(getPagesActiveStatus);

  const [springs, api] = useSpring(() => ({
    from: defaultAnimationState,
    config: {
      duration: 200,
    },
  }));

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  useEffect(() => {
    if (pagesActive) {
      api.start({
        to: expandedAnimationState,
      });
    } else {
      api.start({
        to: defaultAnimationState,
      });
    }

    return () => {
      api.stop();
    };
  }, [pagesActive, api]);

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

  const onMenuClose = useCallback(() => setIsMenuOpen(false), [setIsMenuOpen]);

  const pageElements = useMemo(
    () => pages.map((page) => <PageElement key={page.pageId} page={page} />),
    [pages, location.pathname],
  );

  return (
    <AnimatedFlex
      flexDirection={"column"}
      height={"21.5%"}
      justifyContent={"center"}
      overflow={"hidden"}
      style={springs}
    >
      <PaneHeader
        className="pages"
        rightIcon={
          canCreatePages ? (
            <AddPageContextMenu
              buttonSize="sm"
              className={`${EntityClassNames.ADD_BUTTON} group pages`}
              createPageCallback={createPageCallback}
              onMenuClose={onMenuClose}
              openMenu={isMenuOpen}
            />
          ) : null
        }
        title={`All Pages (${pages.length})`}
      />
      <Flex
        alignItems={"center"}
        flex={"1"}
        flexDirection={"column"}
        overflow={"auto"}
        width={"100%"}
      >
        {pageElements}
      </Flex>
    </AnimatedFlex>
  );
};

export { PagesSection };
