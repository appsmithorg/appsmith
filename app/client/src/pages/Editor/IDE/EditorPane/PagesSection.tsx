import React, { useCallback, useMemo, useState } from "react";

import { IDEHeaderDropdown } from "IDE";
import { createNewPageFromEntities } from "actions/pageActions";
import { PAGE_ENTITY_NAME } from "ee/constants/messages";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { AppState } from "ee/reducers";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { selectAllPages } from "ee/selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getInstanceId } from "ee/selectors/tenantSelectors";
import { getHasCreatePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { Page } from "entities/Page";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import AddPageContextMenu from "pages/Editor/Explorer/Pages/AddPageContextMenu";
import { PageElement } from "pages/Editor/IDE/EditorPane/components/PageElement";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { Text } from "@appsmith/ads";

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
      PAGE_ENTITY_NAME,
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
    <IDEHeaderDropdown>
      <IDEHeaderDropdown.Header className="pages">
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
      </IDEHeaderDropdown.Header>
      <IDEHeaderDropdown.Body>{pageElements}</IDEHeaderDropdown.Body>
    </IDEHeaderDropdown>
  );
};

export { PagesSection };
