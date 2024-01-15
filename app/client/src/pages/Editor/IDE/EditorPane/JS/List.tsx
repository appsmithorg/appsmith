import React from "react";
import { useSelector } from "react-redux";
import { Button, Flex } from "design-system";
import styled from "styled-components";

import { selectJSForPagespane } from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import ExplorerJSCollectionEntity from "pages/Editor/Explorer/JSActions/JSActionEntity";
import type { PluginType } from "entities/Action";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { EmptyState } from "../components/EmptyState";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { useJSAdd } from "./hooks";

const JSContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const ListJSObjects = () => {
  const pageId = useSelector(getCurrentPageId);
  const files = useSelector(selectJSForPagespane);
  const JSObjects = files["JS Objects"];
  const activeActionId = useActiveAction();
  const applicationId = useSelector(getCurrentApplicationId);

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const addButtonClickHandler = useJSAdd();

  return (
    <JSContainer
      className="ide-editor-left-pane__content-js"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      py="spaces-3"
    >
      {JSObjects && JSObjects.length > 0 && canCreateActions && (
        <Flex flexDirection="column" px="spaces-3">
          <Button
            kind={"secondary"}
            onClick={addButtonClickHandler}
            size={"sm"}
            startIcon={"add-line"}
          >
            {createMessage(EDITOR_PANE_TEXTS.js_add_button)}
          </Button>
        </Flex>
      )}
      <FilesContextProvider
        canCreateActions={canCreateActions}
        editorId={applicationId}
        parentEntityId={pageId}
        parentEntityType={ActionParentEntityType.PAGE}
      >
        <Flex flex="1" flexDirection="column" overflowY="auto" px="spaces-3">
          {JSObjects &&
            JSObjects.map((JSobject) => {
              return (
                <Flex flexDirection={"column"} key={JSobject.id}>
                  <ExplorerJSCollectionEntity
                    id={JSobject.id}
                    isActive={JSobject.id === activeActionId}
                    key={JSobject.id}
                    parentEntityId={pageId}
                    parentEntityType={ActionParentEntityType.PAGE}
                    searchKeyword={""}
                    step={2}
                    type={JSobject.type as PluginType}
                  />
                </Flex>
              );
            })}
        </Flex>
      </FilesContextProvider>

      {(!JSObjects || JSObjects.length === 0) && (
        <EmptyState
          buttonText={createMessage(EDITOR_PANE_TEXTS.js_add_button)}
          description={createMessage(
            EDITOR_PANE_TEXTS.js_blank_state_description,
          )}
          icon={"js-square-v3"}
          onClick={canCreateActions ? addButtonClickHandler : undefined}
        />
      )}
    </JSContainer>
  );
};

export default ListJSObjects;
