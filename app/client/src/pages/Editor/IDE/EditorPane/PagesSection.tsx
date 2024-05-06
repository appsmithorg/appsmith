import React, { useCallback, useMemo, useState } from "react";
import { Text } from "design-system";
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
import { IDEHeaderDropdown } from "IDE";

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
