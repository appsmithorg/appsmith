import React, { useCallback, useState } from "react";
import SegmentAddHeader from "../components/SegmentAddHeader";
import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import type { ListItemProps } from "design-system";
import { Flex, SearchInput } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import GroupedList from "../components/GroupedList";
import {
  useGroupedAddJsOperations,
  useJSAdd,
} from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import type { AddProps } from "../types/AddProps";
import { createAddClassName, fuzzySearchInObjectItems } from "../utils";
import { FocusEntity } from "navigation/FocusEntity";
import type { GroupedListProps } from "../components/types";
import { EmptySearchResult } from "../components/EmptySearchResult";

const AddJS = ({ containerProps, innerContainerProps }: AddProps) => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);
  const [searchTerm, setSearchTerm] = useState("");

  const groupedJsOperations = useGroupedAddJsOperations();

  const onCreateItemClick = useCallback(
    (item: ActionOperation) => {
      if (item.action) {
        dispatch(item.action(pageId, "ENTITY_EXPLORER"));
      }
    },
    [pageId, dispatch],
  );
  const { closeAddJS } = useJSAdd();

  const getListItems = (data: ActionOperation) => {
    const title = data.entityExplorerTitle || data.title;
    return {
      startIcon: data.icon,
      title,
      description:
        data.focusEntityType === FocusEntity.JS_MODULE_INSTANCE
          ? data.dsName
          : "",
      descriptionType: "inline",
      onClick: onCreateItemClick.bind(null, data),
      wrapperClassName: createAddClassName(title),
    } as ListItemProps;
  };

  const groups = groupedJsOperations.map((op) => ({
    groupTitle: op.title,
    className: op.className,
    items: op.operations.map(getListItems),
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
          onCloseClick={closeAddJS}
          titleMessage={EDITOR_PANE_TEXTS.js_create_tab_title}
        />
        <SearchInput onChange={setSearchTerm} value={searchTerm} />
        {localGroups.length > 0 ? <GroupedList groups={localGroups} /> : null}
        {localGroups.length === 0 && searchTerm !== "" ? (
          <EmptySearchResult type="JS" />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default AddJS;
