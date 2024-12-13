import React, { useCallback, useState } from "react";
import SegmentAddHeader from "../components/SegmentAddHeader";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import type { ListItemProps } from "@appsmith/ads";
import { Flex, SearchInput } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import GroupedList from "../components/GroupedList";
import {
  useGroupedAddJsOperations,
  useJSAdd,
} from "ee/pages/Editor/IDE/EditorPane/JS/hooks";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { createAddClassName } from "../utils";
import { FocusEntity } from "navigation/FocusEntity";
import { EmptySearchResult } from "../components/EmptySearchResult";
import { getIDEViewMode } from "selectors/ideSelectors";
import type { FlexProps } from "@appsmith/ads";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";

const AddJS = () => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);
  const [searchTerm, setSearchTerm] = useState("");
  const ideViewMode = useSelector(getIDEViewMode);

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

  const itemGroups = groupedJsOperations.map(
    ({ className, operations, title }) => ({
      groupTitle: title,
      className: className,
      items: operations.map(getListItems),
    }),
  );

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
          onCloseClick={closeAddJS}
          titleMessage={EDITOR_PANE_TEXTS.js_create_tab_title}
        />
        <SearchInput onChange={setSearchTerm} value={searchTerm} />
        {filteredItemGroups.length > 0 ? (
          <GroupedList groups={filteredItemGroups} />
        ) : null}
        {filteredItemGroups.length === 0 && searchTerm !== "" ? (
          <EmptySearchResult
            type={createMessage(EDITOR_PANE_TEXTS.search_objects.jsObject)}
          />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default AddJS;
