import React, { useState } from "react";
import {
  Flex,
  Text,
  SearchAndAdd,
  NoSearchResults,
  EntityGroupsList,
} from "@appsmith/ads";
import { useSelector } from "react-redux";

import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { selectQuerySegmentEditorList } from "ee/selectors/appIDESelectors";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { FilesContextProvider } from "pages/Editor/Explorer/Files/FilesContextProvider";
import { useQueryAdd } from "../QueryAdd";
import { QueryListItem } from "ee/pages/AppIDE/components/QueryEntityItem/old/ListItem";
import { getShowWorkflowFeature } from "ee/selectors/workflowSelectors";
import { BlankState } from "./BlankState";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";
import { ActionEntityItem } from "ee/pages/AppIDE/components/QueryEntityItem/ListItem";
import { useLocation } from "react-router";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import { useCreateActionsPermissions } from "ee/entities/IDE/hooks/useCreateActionsPermissions";
import { objectKeys } from "@appsmith/utils";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

export const ListQuery = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const itemGroups = useSelector(selectQuerySegmentEditorList);
  const activeActionBaseId = useActiveActionBaseId();

  const location = useLocation();
  const ideType = getIDETypeByUrl(location.pathname);
  const { editorId, parentEntityId } = useParentEntityInfo(ideType);
  const canCreateActions = useCreateActionsPermissions(ideType);

  const showWorkflows = useSelector(getShowWorkflowFeature);

  const isNewADSTemplatesEnabled = useFeatureFlag(
    FEATURE_FLAG.release_ads_entity_item_enabled,
  );

  const filteredItemGroups = filterEntityGroupsBySearchTerm(
    searchTerm,
    itemGroups,
  );

  const { openAddQuery } = useQueryAdd();

  return (
    <Flex
      flex="1"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      px="spaces-3"
      py="spaces-3"
    >
      {objectKeys(itemGroups).length === 0 && <BlankState />}

      {itemGroups.length > 0 ? (
        <SearchAndAdd
          onAdd={openAddQuery}
          onSearch={setSearchTerm}
          showAddButton={canCreateActions}
        />
      ) : null}
      <Flex
        data-testid="t--ide-list"
        flexDirection={"column"}
        gap="spaces-3"
        overflowY="auto"
      >
        {isNewADSTemplatesEnabled ? (
          <EntityGroupsList
            groups={filteredItemGroups.map(({ group, items }) => {
              return {
                groupTitle: group,
                items: items,
                className: "",
                renderList: (item: EntityItem) => {
                  return <ActionEntityItem item={item} />;
                },
              };
            })}
          />
        ) : (
          filteredItemGroups.map(({ group, items }) => {
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
                  editorId={editorId}
                  parentEntityId={parentEntityId}
                  parentEntityType={ActionParentEntityType.PAGE}
                  showWorkflows={showWorkflows}
                >
                  {items.map((file) => {
                    return (
                      <QueryListItem
                        isActive={file.key === activeActionBaseId}
                        item={file}
                        key={file.key}
                        parentEntityId={parentEntityId}
                      />
                    );
                  })}
                </FilesContextProvider>
              </Flex>
            );
          })
        )}
        {filteredItemGroups.length === 0 && searchTerm !== "" ? (
          <NoSearchResults
            text={createMessage(
              EDITOR_PANE_TEXTS.empty_search_result,
              createMessage(EDITOR_PANE_TEXTS.search_objects.queries),
            )}
          />
        ) : null}
      </Flex>
    </Flex>
  );
};
