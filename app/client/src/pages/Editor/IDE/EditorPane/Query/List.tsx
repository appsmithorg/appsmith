import React, { useState } from "react";
import {
  Flex,
  SearchAndAdd,
  NoSearchResults,
  EntityGroupsList,
} from "@appsmith/ads";
import { useSelector } from "react-redux";

import { selectQuerySegmentEditorList } from "ee/selectors/appIDESelectors";
import { useQueryAdd } from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { BlankState } from "./BlankState";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";
import { ActionEntityItem } from "ee/pages/Editor/IDE/EditorPane/Query/ListItem";
import { useLocation } from "react-router";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { useCreateActionsPermissions } from "ee/entities/IDE/hooks/useCreateActionsPermissions";
import { objectKeys } from "@appsmith/utils";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

const ListQuery = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const itemGroups = useSelector(selectQuerySegmentEditorList);

  const location = useLocation();
  const ideType = getIDETypeByUrl(location.pathname);
  const canCreateActions = useCreateActionsPermissions(ideType);

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
        gap="spaces-4"
        overflowY="auto"
      >
        <EntityGroupsList
          groups={filteredItemGroups.map(({ group, items }) => {
            return {
              groupTitle: group,
              items: items,
              className: "",
              renderList: (item: EntityItem) => {
                return <ActionEntityItem item={item} key={item.key} />;
              },
            };
          })}
        />
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

export default ListQuery;
