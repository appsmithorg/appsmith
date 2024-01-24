import React, { useCallback } from "react";
import SegmentAddHeader from "../components/SegmentAddHeader";
import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import type { ListItemProps } from "design-system";
import { Flex } from "design-system";
import history from "utils/history";
import { ADD_PATH } from "@appsmith/constants/routes/appRoutes";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import GroupedList from "../components/GroupedList";
import { useGroupedAddJsOperations } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";

const AddJS = () => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);
  const closeButtonClickHandler = useCallback(() => {
    history.push(location.pathname.replace(`${ADD_PATH}`, ""));
  }, []);

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
      description: "",
      descriptionType: "inline",
      onClick: onCreateItemClick.bind(null, data),
    } as ListItemProps;
  };

  return (
    <Flex flexDirection="column" gap={"spaces-4"}>
      <SegmentAddHeader
        onCloseClick={closeButtonClickHandler}
        titleMessage={EDITOR_PANE_TEXTS.js_create_tab_title}
      />
      <GroupedList
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
