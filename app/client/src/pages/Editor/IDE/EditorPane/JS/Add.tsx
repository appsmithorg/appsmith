import React, { useCallback } from "react";
import SegmentAddHeader from "../components/SegmentAddHeader";
import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import type { ListItemProps } from "design-system";
import { Flex, Tag } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import GroupedList from "../components/GroupedList";
import {
  useGroupedAddJsOperations,
  useJSAdd,
} from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import type { AddProps } from "../types/AddProps";

const AddJS = ({ containerProps, innerContainerProps }: AddProps) => {
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
      description: !!data.isBeta ? <Tag isClosable={false}>Beta</Tag> : "",
      descriptionType: "inline",
      onClick: onCreateItemClick.bind(null, data),
    } as ListItemProps;
  };

  return (
    <Flex justifyContent="center" p="spaces-3" {...containerProps}>
      <Flex
        flexDirection="column"
        gap={"spaces-4"}
        overflow="hidden"
        width="100%"
        {...innerContainerProps}
      >
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
    </Flex>
  );
};

export default AddJS;
