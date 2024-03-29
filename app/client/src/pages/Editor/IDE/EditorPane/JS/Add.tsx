import React, { useCallback } from "react";
import SegmentAddHeader from "../components/SegmentAddHeader";
import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import type { ListItemProps } from "design-system";
import { Flex } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import GroupedList from "../components/GroupedList";
import {
  useGroupedAddJsOperations,
  useJSAdd,
} from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";

const AddJS = () => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);
  const closeButtonClickHandler = useJSAdd();

  const groupedJsOperations = useGroupedAddJsOperations();

  const onCreateItemClick = useCallback(
    (item: ActionOperation) => {
      if (item.action) {
        dispatch(item.action(pageId, "ENTITY_EXPLORER"));
      }
    },
    [pageId, dispatch],
  );

  const getListItems = (data: ActionOperation) => {
    return {
      startIcon: data.icon,
      title: data.entityExplorerTitle || data.title,
      description: !!data.isBeta ? "Beta" : "",
      descriptionType: "inline",
      onClick: onCreateItemClick.bind(null, data),
    } as ListItemProps;
  };

  return (
    <Flex flexDirection="column" gap={"spaces-4"} overflow="hidden">
      <SegmentAddHeader
        onCloseClick={closeButtonClickHandler}
        titleMessage={EDITOR_PANE_TEXTS.js_create_tab_title}
      />
      <GroupedList
        flexProps={{
          pr: "spaces-2",
          px: "spaces-3",
        }}
        groups={groupedJsOperations.map((op) => ({
          groupTitle: op.title,
          className: op.className,
          items: op.operations.map(getListItems),
        }))}
      />
    </Flex>
  );
};

export default AddJS;
