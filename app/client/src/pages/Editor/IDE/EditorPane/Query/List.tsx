import React from "react";
import { Button, Flex, Text } from "design-system";
import { useSelector } from "react-redux";

import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import {
  getCurrentApplicationId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { selectQuerySegmentEditorList } from "@appsmith/selectors/appIDESelectors";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { useQueryAdd } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { QueryListItem } from "@appsmith/pages/Editor/IDE/EditorPane/Query/ListItem";
import { getShowWorkflowFeature } from "@appsmith/selectors/workflowSelectors";
import { BlankState } from "./BlankState";

const ListQuery = () => {
  const pageId = useSelector(getCurrentPageId) as string;
  const files = useSelector(selectQuerySegmentEditorList);
  const activeActionId = useActiveAction();
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const applicationId = useSelector(getCurrentApplicationId);

  const addButtonClickHandler = useQueryAdd();
  const showWorkflows = useSelector(getShowWorkflowFeature);

  return (
    <Flex
      flex="1"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      py="spaces-3"
    >
      {files.length > 0 && canCreateActions && (
        <Flex flexDirection={"column"} px="spaces-3">
          <Button
            className="t--add-item"
            kind={"secondary"}
            onClick={addButtonClickHandler}
            size={"sm"}
            startIcon={"add-line"}
          >
            {createMessage(EDITOR_PANE_TEXTS.query_add_button)}
          </Button>
        </Flex>
      )}
      <Flex
        flexDirection={"column"}
        gap="spaces-4"
        overflowY="auto"
        px="spaces-3"
      >
        {files.map(({ group, items }) => {
          return (
            <Flex flexDirection={"column"} key={group}>
              <Flex px="spaces-3" py="spaces-1">
                <Text
                  className="overflow-hidden overflow-ellipsis whitespace-nowrap"
                  kind="body-s"
                >
                  {group}
                </Text>
              </Flex>
              <FilesContextProvider
                canCreateActions={canCreateActions}
                editorId={applicationId}
                parentEntityId={pageId}
                parentEntityType={ActionParentEntityType.PAGE}
                showWorkflows={showWorkflows}
              >
                {items.map((file) => {
                  return (
                    <QueryListItem
                      isActive={file.key === activeActionId}
                      item={file}
                      key={file.key}
                      parentEntityId={pageId}
                      parentEntityType={ActionParentEntityType.PAGE}
                    />
                  );
                })}
              </FilesContextProvider>
            </Flex>
          );
        })}
      </Flex>

      {Object.keys(files).length === 0 && <BlankState />}
    </Flex>
  );
};

export default ListQuery;
