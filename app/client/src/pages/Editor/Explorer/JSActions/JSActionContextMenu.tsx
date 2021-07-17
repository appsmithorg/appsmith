import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";

import { AppState } from "reducers";
import ContextMenuTrigger from "../ContextMenuTrigger";

import {
  moveJSActionRequest,
  copyJSActionRequest,
  deleteJSAction,
} from "actions/jsActionActions";

import { ContextMenuPopoverModifiers } from "../helpers";
import { noop } from "lodash";
import { useNewJSActionName } from "./helpers";

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
  pageId: string;
};
export function JSActionEntityContextMenu(props: EntityContextMenuProps) {
  const nextEntityName = useNewJSActionName();

  const dispatch = useDispatch();
  const copyJSActionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) =>
      dispatch(
        copyJSActionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: nextEntityName(actionName, pageId, true),
        }),
      ),
    [dispatch, nextEntityName],
  );
  const moveJSActionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) =>
      dispatch(
        moveJSActionRequest({
          id: actionId,
          destinationPageId,
          originalPageId: props.pageId,
          name: nextEntityName(actionName, destinationPageId),
        }),
      ),
    [dispatch, nextEntityName, props.pageId],
  );
  const deleteJSActionFromPage = useCallback(
    (actionId: string, actionName: string) =>
      dispatch(deleteJSAction({ id: actionId, name: actionName })),
    [dispatch],
  );

  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map((page) => ({
      label: page.pageName,
      id: page.pageId,
      value: page.pageName,
    }));
  });

  return (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      optionTree={[
        {
          value: "copy",
          onSelect: noop,
          label: "Copy to page",
          children: menuPages.map((page) => {
            return {
              ...page,
              onSelect: () => copyJSActionToPage(props.id, props.name, page.id),
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
                        moveJSActionToPage(props.id, props.name, page.id),
                    };
                  })
              : [{ value: "No Pages", onSelect: noop, label: "No Pages" }],
        },
        {
          value: "delete",
          onSelect: () => deleteJSActionFromPage(props.id, props.name),
          label: "Delete",
          intent: "danger",
        },
      ]}
      selectedValue=""
      toggle={<ContextMenuTrigger />}
    />
  );
}

export default JSActionEntityContextMenu;
