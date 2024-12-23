import React, { useState } from "react";
import {
  Flex,
  SearchInput,
  NoSearchResults,
  type FlexProps,
} from "@appsmith/ads";

import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import SegmentAddHeader from "../components/SegmentAddHeader";
import GroupedList from "../components/GroupedList";
import {
  useAddQueryListItems,
  useGroupedAddQueryOperations,
  useQueryAdd,
} from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";

const AddQuery = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { getListItems } = useAddQueryListItems();
  const groupedActionOperations = useGroupedAddQueryOperations();
  const { closeAddQuery } = useQueryAdd();
  const ideViewMode = useSelector(getIDEViewMode);

  const itemGroups = groupedActionOperations.map((group) => ({
    groupTitle: group.title,
    className: group.className,
    items: getListItems(group.operations),
  }));

  const filteredItemGroups = filterEntityGroupsBySearchTerm(
    searchTerm,
    itemGroups,
  );

  const extraPadding: FlexProps =
    ideViewMode === EditorViewMode.FullScreen
      ? {
          px: "spaces-4",
          py: "spaces-7",
        }
      : {};

  return (
    <Flex
      data-testid="t--ide-add-pane"
      height="100%"
      justifyContent="center"
      p="spaces-3"
      {...extraPadding}
    >
      <Flex
        flexDirection="column"
        gap={"spaces-4"}
        maxW="40vw"
        overflow="hidden"
        width="100%"
      >
        <SegmentAddHeader
          onCloseClick={closeAddQuery}
          titleMessage={EDITOR_PANE_TEXTS.query_create_tab_title}
        />
        <SearchInput autoFocus onChange={setSearchTerm} value={searchTerm} />
        {filteredItemGroups.length > 0 ? (
          <GroupedList groups={filteredItemGroups} />
        ) : null}
        {filteredItemGroups.length === 0 && searchTerm !== "" ? (
          <NoSearchResults
            text={createMessage(
              EDITOR_PANE_TEXTS.empty_search_result,
              createMessage(EDITOR_PANE_TEXTS.search_objects.datasources),
            )}
          />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default AddQuery;
