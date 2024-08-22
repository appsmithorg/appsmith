import React, { useState } from "react";

import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { QueryListItem } from "ee/pages/Editor/IDE/EditorPane/Query/ListItem";
import { useQueryAdd } from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import type { EditorSegmentList } from "ee/selectors/appIDESelectors";
import { selectQuerySegmentEditorList } from "ee/selectors/appIDESelectors";
import { getShowWorkflowFeature } from "ee/selectors/workflowSelectors";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { Flex, Text } from "@appsmith/ads";

import { AddAndSearchbar } from "../components/AddAndSearchbar";
import { EmptySearchResult } from "../components/EmptySearchResult";
import { fuzzySearchInObjectItems } from "../utils";
import { BlankState } from "./BlankState";

const ListQuery = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const pageId = useSelector(getCurrentPageId) as string;
  const files = useSelector(selectQuerySegmentEditorList);
  const activeActionBaseId = useActiveActionBaseId();
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const localFiles = fuzzySearchInObjectItems<EditorSegmentList>(
    searchTerm,
    files,
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
      {files.length > 0 ? (
        <AddAndSearchbar
          hasAddPermission={canCreateActions}
          onAddClick={openAddQuery}
          onSearch={setSearchTerm}
        />
      ) : null}
      <Flex flexDirection={"column"} gap="spaces-4" overflowY="auto">
        {localFiles.map(({ group, items }) => {
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
        {localFiles.length === 0 && searchTerm !== "" ? (
          <EmptySearchResult
            type={createMessage(EDITOR_PANE_TEXTS.search_objects.jsObject)}
          />
        ) : null}
      </Flex>

      {Object.keys(files).length === 0 && <BlankState />}
    </Flex>
  );
};

export default ListQuery;
