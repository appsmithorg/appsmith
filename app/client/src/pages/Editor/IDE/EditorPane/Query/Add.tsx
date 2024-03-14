import React from "react";
import { Flex } from "design-system";

import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import SegmentAddHeader from "../components/SegmentAddHeader";
import GroupedList from "../components/GroupedList";
import {
  useAddQueryListItems,
  useGroupedAddQueryOperations,
  useQueryAdd,
} from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";

const AddQuery = () => {
  const { getListItems } = useAddQueryListItems();
  const groupedActionOperations = useGroupedAddQueryOperations();

  const closeButtonClickHandler = useQueryAdd();

  return (
    <Flex flexDirection="column" gap={"spaces-4"} overflow="hidden">
      <SegmentAddHeader
        onCloseClick={closeButtonClickHandler}
        titleMessage={EDITOR_PANE_TEXTS.query_create_tab_title}
      />
      <GroupedList
        flexProps={{
          pr: "spaces-2",
          px: "spaces-3",
        }}
        groups={groupedActionOperations.map((group) => ({
          groupTitle: group.title,
          className: group.className,
          items: getListItems(group.operations),
        }))}
      />
    </Flex>
  );
};

export default AddQuery;
