import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";
import { AppState } from "reducers";
import ContextMenuTrigger from "../ContextMenuTrigger";
import {
  moveJSCollectionRequest,
  copyJSCollectionRequest,
  deleteJSCollection,
} from "actions/jsActionActions";
import { ContextMenuPopoverModifiers } from "../helpers";
import { noop } from "lodash";
import { useNewJSCollectionName } from "./helpers";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONTEXT_EDIT_NAME,
  CONTEXT_MOVE,
  CONTEXT_NO_PAGE,
  CONTEXT_SHOW_BINDING,
  createMessage,
} from "@appsmith/constants/messages";

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
  pageId: string;
};
export function JSCollectionEntityContextMenu(props: EntityContextMenuProps) {
  const nextEntityName = useNewJSCollectionName();

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
    (actionId: string, actionName: string, pageId: string) =>
      dispatch(
        copyJSCollectionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: nextEntityName(actionName, pageId, true),
        }),
      ),
    [dispatch, nextEntityName],
  );
  const moveJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) =>
      dispatch(
        moveJSCollectionRequest({
          id: actionId,
          destinationPageId,
          name: nextEntityName(actionName, destinationPageId, false),
        }),
      ),
    [dispatch, nextEntityName, props.pageId],
  );
  const deleteJSCollectionFromPage = useCallback(
    (actionId: string, actionName: string) =>
      dispatch(deleteJSCollection({ id: actionId, name: actionName })),
    [dispatch],
  );

  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map((page) => ({
      label: page.pageName,
      id: page.pageId,
      value: page.pageName,
    }));
  });
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
          value: "delete",
          onSelect: () => deleteJSCollectionFromPage(props.id, props.name),
          label: createMessage(CONTEXT_DELETE),
          intent: "danger",
        },
      ]}
      selectedValue=""
      toggle={<ContextMenuTrigger />}
    />
  );
}

export default JSCollectionEntityContextMenu;
