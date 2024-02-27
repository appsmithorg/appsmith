import React, { useCallback } from "react";
import { Flex } from "design-system";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";

import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import { ADD_PATH } from "constants/routes";
import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import SegmentAddHeader from "../components/SegmentAddHeader";
import GroupedList from "../components/GroupedList";
import {
  useAddQueryListItems,
  useGroupedAddQueryOperations,
} from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";

const AddQuery = () => {
  const location = useLocation();
  const pageId = useSelector(getCurrentPageId) as string;
  const { getListItems } = useAddQueryListItems();
  const groupedActionOperations = useGroupedAddQueryOperations();

  const closeButtonClickHandler = useCallback(() => {
    history.push(location.pathname.replace(`${ADD_PATH}`, ""));
  }, [pageId]);

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
