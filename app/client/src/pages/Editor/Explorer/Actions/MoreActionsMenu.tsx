import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppState } from "reducers";
import { getNextEntityName } from "utils/AppsmithUtils";

import {
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/actionActions";

import { ContextMenuPopoverModifiers } from "../helpers";
import { noop } from "lodash";
import TreeDropdown from "components/ads/TreeDropdown";

const useNewAPIName = () => {
  // This takes into consideration only the current page widgets
  // If we're moving to a different page, there could be a widget
  // with the same name as the generated API name
  // TODO: Figure out how to handle this scenario
  const apiNames = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config.name),
  );
  return (name: string) =>
    apiNames.indexOf(name) > -1 ? getNextEntityName(name, apiNames) : name;
};

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
  pageId: string;
};
export const MoreActionsMenu = (props: EntityContextMenuProps) => {
  const nextEntityName = useNewAPIName();

  const dispatch = useDispatch();
  const copyActionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) =>
      dispatch(
        copyActionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: nextEntityName(`${actionName}Copy`),
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
          name: nextEntityName(actionName),
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

  return (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      selectedValue=""
      optionTree={[
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
          className: "t--apiFormDeleteBtn",
        },
      ]}
    />
  );
};

export default MoreActionsMenu;
