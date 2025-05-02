import React, { useCallback, useMemo, useState } from "react";
import { ListWithHeader } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";

import { selectAllPages } from "ee/selectors/entitiesSelector";
import type { Page } from "entities/Page";
import { getHasCreatePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { DefaultRootState } from "react-redux";
import { createNewPageFromEntities } from "actions/pageActions";
import AddPageContextMenu from "./AddPageContextMenu";
import { getNextEntityName } from "utils/AppsmithUtils";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getInstanceId } from "ee/selectors/organizationSelectors";
import { PageList } from "./PageList";
import { PAGE_ENTITY_NAME } from "ee/constants/messages";

const PagesSection = ({ onItemSelected }: { onItemSelected: () => void }) => {
  const dispatch = useDispatch();
  const pages: Page[] = useSelector(selectAllPages);
  const applicationId = useSelector(getCurrentApplicationId);
  const userAppPermissions = useSelector(
    (state: DefaultRootState) =>
      getCurrentApplication(state)?.userPermissions ?? [],
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
  }, [pages, dispatch, applicationId, workspaceId, instanceId]);

  const onMenuClose = useCallback(() => setIsMenuOpen(false), [setIsMenuOpen]);

  const createPageContextMenu = useMemo(() => {
    if (!canCreatePages) return null;

    return (
      <AddPageContextMenu
        buttonSize="sm"
        className={`${EntityClassNames.ADD_BUTTON} group pages`}
        createPageCallback={createPageCallback}
        onItemSelected={onItemSelected}
        onMenuClose={onMenuClose}
        openMenu={isMenuOpen}
      />
    );
  }, [
    canCreatePages,
    createPageCallback,
    isMenuOpen,
    onItemSelected,
    onMenuClose,
  ]);

  return (
    <ListWithHeader
      headerClassName={"pages"}
      headerControls={createPageContextMenu}
      headerText={`All Pages (${pages.length})`}
      maxHeight={"300px"}
    >
      <PageList onItemSelected={onItemSelected} pages={pages} />
    </ListWithHeader>
  );
};

export { PagesSection };
