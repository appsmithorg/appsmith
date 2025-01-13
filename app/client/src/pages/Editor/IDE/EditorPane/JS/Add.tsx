import React, { useCallback, useState } from "react";
import SegmentAddHeader from "../components/SegmentAddHeader";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import type { ListItemProps } from "@appsmith/ads";
import {
  EntityGroupsList,
  Flex,
  SearchInput,
  NoSearchResults,
} from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  useGroupedAddJsOperations,
  useJSAdd,
} from "ee/pages/Editor/IDE/EditorPane/JS/hooks";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { createAddClassName } from "../utils";
import { FocusEntity } from "navigation/FocusEntity";
import { getIDEViewMode } from "selectors/ideSelectors";
import type { FlexProps } from "@appsmith/ads";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";
import { DEFAULT_GROUP_LIST_SIZE } from "../../constants";

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
      className: createAddClassName(title),
    } as ListItemProps;
  };

  const itemGroups = groupedJsOperations.map(
    ({ className, operations, title }) => ({
      groupTitle: title || "",
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
              createMessage(EDITOR_PANE_TEXTS.search_objects.jsObject),
            )}
          />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default AddJS;
