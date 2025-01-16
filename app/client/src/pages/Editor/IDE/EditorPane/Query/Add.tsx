import React, { useState } from "react";
import {
  EntityGroupsList,
  Flex,
  SearchInput,
  NoSearchResults,
  type FlexProps,
  type ListItemProps,
} from "@appsmith/ads";

import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import SegmentAddHeader from "../components/SegmentAddHeader";
import {
  useGroupedAddQueryOperations,
  useQueryAdd,
} from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";
import { DEFAULT_GROUP_LIST_SIZE } from "../../constants";

const AddQuery = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const itemGroups = useGroupedAddQueryOperations();
  const { closeAddQuery } = useQueryAdd();
  const ideViewMode = useSelector(getIDEViewMode);

  const filteredItemGroups = filterEntityGroupsBySearchTerm<
    { groupTitle: string; className: string },
    ListItemProps
  >(searchTerm, itemGroups);

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
          <EntityGroupsList
            flexProps={{
              pb: "spaces-3",
            }}
            groups={filteredItemGroups}
            showDivider
            visibleItems={DEFAULT_GROUP_LIST_SIZE}
          />
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
