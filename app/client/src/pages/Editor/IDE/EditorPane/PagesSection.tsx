import React, { useCallback, useMemo, useState } from "react";
import { Flex, Text } from "design-system";
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
import AddPageContextMenu from "pages/Editor/Explorer/Pages/AddPageContextMenu";
import { getNextEntityName } from "utils/AppsmithUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { PageElement } from "pages/Editor/IDE/EditorPane/components/PageElement";
import styled from "styled-components";

const Container = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const Header = styled.div`
  padding: var(--ads-v2-spaces-3);
  padding-right: var(--ads-v2-spaces-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  span {
    line-height: 20px;
  }
`;

const PagesSection = ({ onItemSelected }: { onItemSelected: () => void }) => {
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

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );
    dispatch(
      createNewPageFromEntities(applicationId, name, workspaceId, instanceId),
    );
  }, [dispatch, pages, applicationId]);

  const onMenuClose = useCallback(() => setIsMenuOpen(false), [setIsMenuOpen]);

  const pageElements = useMemo(
    () =>
      pages.map((page) => (
        <PageElement key={page.pageId} onClick={onItemSelected} page={page} />
      )),
    [pages, location.pathname],
  );

  return (
    <Container
      flexDirection={"column"}
      justifyContent={"center"}
      maxHeight={"300px"}
      overflow={"hidden"}
    >
      <Header className="pages">
        <Text kind="heading-xs">{`All Pages (${pages.length})`}</Text>
        {canCreatePages ? (
          <AddPageContextMenu
            buttonSize="sm"
            className={`${EntityClassNames.ADD_BUTTON} group pages`}
            createPageCallback={createPageCallback}
            onItemSelected={onItemSelected}
            onMenuClose={onMenuClose}
            openMenu={isMenuOpen}
          />
        ) : null}
      </Header>
      <Flex
        alignItems={"center"}
        flex={"1"}
        flexDirection={"column"}
        overflow={"auto"}
        px="spaces-2"
        width={"100%"}
      >
        {pageElements}
      </Flex>
    </Container>
  );
};

export { PagesSection };
