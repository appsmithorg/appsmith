import React, { useState } from "react";
import { Flex, SearchInput } from "design-system";

import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import SegmentAddHeader from "../components/SegmentAddHeader";
import GroupedList from "../components/GroupedList";
import {
  useAddQueryListItems,
  useGroupedAddQueryOperations,
  useQueryAdd,
} from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import type { AddProps } from "../types/AddProps";
import { fuzzySearchInObjectItems } from "../utils";
import type { GroupedListProps } from "../components/types";
import { EmptySearchResult } from "../components/EmptySearchResult";

const AddQuery = ({ containerProps, innerContainerProps }: AddProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { getListItems } = useAddQueryListItems();
  const groupedActionOperations = useGroupedAddQueryOperations();
  const { closeAddQuery } = useQueryAdd();

  const groups = groupedActionOperations.map((group) => ({
    groupTitle: group.title,
    className: group.className,
    items: getListItems(group.operations),
  }));

  const localGroups = fuzzySearchInObjectItems<GroupedListProps[]>(
    searchTerm,
    groups,
  );

  return (
    <Flex
      data-testid="t--ide-add-pane"
      height="100%"
      justifyContent="center"
      p="spaces-3"
      {...containerProps}
    >
      <Flex
        flexDirection="column"
        gap={"spaces-4"}
        overflow="hidden"
        width="100%"
        {...innerContainerProps}
      >
        <SegmentAddHeader
          onCloseClick={closeAddQuery}
          titleMessage={EDITOR_PANE_TEXTS.query_create_tab_title}
        />
        <SearchInput autofocus onChange={setSearchTerm} value={searchTerm} />
        {localGroups.length > 0 ? <GroupedList groups={localGroups} /> : null}
        {localGroups.length === 0 && searchTerm !== "" ? (
          <EmptySearchResult type="datasources" />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default AddQuery;
