import React, { useState } from "react";
import { Flex, Text, SearchAndAdd, NoSearchResults } from "@appsmith/ads";
import { useSelector } from "react-redux";

import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { selectQuerySegmentEditorList } from "ee/selectors/appIDESelectors";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { useQueryAdd } from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { QueryListItem } from "ee/pages/Editor/IDE/EditorPane/Query/ListItem";
import { getShowWorkflowFeature } from "ee/selectors/workflowSelectors";
import { BlankState } from "./BlankState";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";

const ListQuery = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const pageId = useSelector(getCurrentPageId) as string;
  const itemGroups = useSelector(selectQuerySegmentEditorList);
  const activeActionBaseId = useActiveActionBaseId();
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const filteredItemGroups = filterEntityGroupsBySearchTerm(
    searchTerm,
    itemGroups,
  );

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const applicationId = useSelector(getCurrentApplicationId);

  const { openAddQuery } = useQueryAdd();
  const showWorkflows = useSelector(getShowWorkflowFeature);

  return (
    <Flex
      flex="1"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      px="spaces-3"
      py="spaces-3"
    >
      {itemGroups.length > 0 ? (
        <SearchAndAdd
          onAdd={openAddQuery}
          onSearch={setSearchTerm}
          showAddButton={canCreateActions}
        />
      ) : null}
      <Flex flexDirection={"column"} gap="spaces-4" overflowY="auto">
        {filteredItemGroups.map(({ group, items }) => {
          return (
            <Flex flexDirection={"column"} key={group}>
              <Flex py="spaces-1">
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
                      isActive={file.key === activeActionBaseId}
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
        {filteredItemGroups.length === 0 && searchTerm !== "" ? (
          <NoSearchResults
            text={createMessage(
              EDITOR_PANE_TEXTS.empty_search_result,
              createMessage(EDITOR_PANE_TEXTS.search_objects.queries),
            )}
          />
        ) : null}
      </Flex>

      {Object.keys(itemGroups).length === 0 && <BlankState />}
    </Flex>
  );
};

export default ListQuery;
