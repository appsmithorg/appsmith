import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";

import { AppState } from "reducers";
import ContextMenuTrigger from "../ContextMenuTrigger";

import {
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/actionActions";

import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { ContextMenuPopoverModifiers } from "../helpers";
import { noop } from "lodash";
import { useNewActionName } from "./helpers";

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
  pageId: string;
};
export const ActionEntityContextMenu = (props: EntityContextMenuProps) => {
  const nextEntityName = useNewActionName();

  const dispatch = useDispatch();
  const copyActionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) =>
      dispatch(
        copyActionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: nextEntityName(`${actionName}Copy`, pageId),
        }),
      ),
    [dispatch, nextEntityName],
  );
  const moveActionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) =>
      dispatch(
        moveActionRequest({
          id: actionId,
          destinationPageId,
          originalPageId: props.pageId,
          name: nextEntityName(actionName, destinationPageId),
        }),
      ),
    [dispatch, nextEntityName, props.pageId],
  );
  const deleteActionFromPage = useCallback(
    (actionId: string, actionName: string) =>
      dispatch(deleteAction({ id: actionId, name: actionName })),
    [dispatch],
  );

  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map((page) => ({
      label: page.pageName,
      id: page.pageId,
      value: page.pageName,
    }));
  });

  const editActionName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(props.id)),
    [dispatch, props.id],
  );

  return (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      selectedValue=""
      optionTree={[
        {
          value: "rename",
          onSelect: editActionName,
          label: "Edit Name",
        },
        {
          value: "copy",
          onSelect: noop,
          label: "Copy to page",
          children: menuPages.map((page) => {
            return {
              ...page,
              onSelect: () => copyActionToPage(props.id, props.name, page.id),
            };
          }),
        },
        {
          value: "move",
          onSelect: noop,
          label: "Move to page",
          children:
            menuPages.length > 1
              ? menuPages
                  .filter((page) => page.id !== props.pageId) // Remove current page from the list
                  .map((page) => {
                    return {
                      ...page,
                      onSelect: () =>
                        moveActionToPage(props.id, props.name, page.id),
                    };
                  })
              : [{ value: "No Pages", onSelect: noop, label: "No Pages" }],
        },
        {
          value: "delete",
          onSelect: () => deleteActionFromPage(props.id, props.name),
          label: "Delete",
          intent: "danger",
        },
      ]}
      toggle={<ContextMenuTrigger />}
    />
  );
};

export default ActionEntityContextMenu;
