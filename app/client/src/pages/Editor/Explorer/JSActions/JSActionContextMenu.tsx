import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";
import ContextMenuTrigger from "../ContextMenuTrigger";
import {
  moveJSCollectionRequest,
  copyJSCollectionRequest,
  deleteJSCollection,
} from "actions/jsActionActions";
import { ContextMenuPopoverModifiers } from "../helpers";
import noop from "lodash/noop";
import { getJSEntityName } from "./helpers";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_EDIT_NAME,
  CONTEXT_MOVE,
  CONTEXT_NO_PAGE,
  CONTEXT_SHOW_BINDING,
  createMessage,
} from "@appsmith/constants/messages";
import { getPageListAsOptions } from "selectors/entitiesSelector";

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
  pageId: string;
};
export function JSCollectionEntityContextMenu(props: EntityContextMenuProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();

  const showBinding = useCallback(
    (actionId, actionName) =>
      dispatch({
        type: ReduxActionTypes.SET_ENTITY_INFO,
        payload: {
          entityId: actionId,
          entityName: actionName,
          entityType: ENTITY_TYPE.JSACTION,
          show: true,
        },
      }),
    [],
  );

  const copyJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) => {
      const nextEntityName = getJSEntityName();
      dispatch(
        copyJSCollectionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: nextEntityName(actionName, pageId, true),
        }),
      );
    },
    [dispatch],
  );
  const moveJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) => {
      const nextEntityName = getJSEntityName();
      dispatch(
        moveJSCollectionRequest({
          id: actionId,
          destinationPageId,
          name: nextEntityName(actionName, destinationPageId, false),
        }),
      );
    },
    [dispatch, props.pageId],
  );
  const deleteJSCollectionFromPage = useCallback(
    (actionId: string, actionName: string) =>
      dispatch(deleteJSCollection({ id: actionId, name: actionName })),
    [dispatch],
  );

  const menuPages = useSelector(getPageListAsOptions);
  const editJSCollectionName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(props.id)),
    [dispatch, props.id],
  );

  return (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      optionTree={[
        {
          value: "rename",
          onSelect: editJSCollectionName,
          label: createMessage(CONTEXT_EDIT_NAME),
        },
        {
          value: "showBinding",
          onSelect: () => showBinding(props.id, props.name),
          label: createMessage(CONTEXT_SHOW_BINDING),
        },
        {
          value: "copy",
          onSelect: noop,
          label: createMessage(CONTEXT_COPY),
          children: menuPages.map((page) => {
            return {
              ...page,
              onSelect: () =>
                copyJSCollectionToPage(props.id, props.name, page.id),
            };
          }),
        },
        {
          value: "move",
          onSelect: noop,
          label: createMessage(CONTEXT_MOVE),
          children:
            menuPages.length > 1
              ? menuPages
                  .filter((page) => page.id !== props.pageId) // Remove current page from the list
                  .map((page) => {
                    return {
                      ...page,
                      onSelect: () =>
                        moveJSCollectionToPage(props.id, props.name, page.id),
                    };
                  })
              : [
                  {
                    value: "No Pages",
                    onSelect: noop,
                    label: createMessage(CONTEXT_NO_PAGE),
                  },
                ],
        },
        {
          confirmDelete: confirmDelete,
          className: "t--apiFormDeleteBtn single-select",
          value: "delete",
          onSelect: () => {
            confirmDelete
              ? deleteJSCollectionFromPage(props.id, props.name)
              : setConfirmDelete(true);
          },
          label: confirmDelete
            ? createMessage(CONFIRM_CONTEXT_DELETE)
            : createMessage(CONTEXT_DELETE),
          intent: "danger",
        },
      ]}
      selectedValue=""
      setConfirmDelete={setConfirmDelete}
      toggle={<ContextMenuTrigger className="t--context-menu" />}
    />
  );
}

export default JSCollectionEntityContextMenu;
