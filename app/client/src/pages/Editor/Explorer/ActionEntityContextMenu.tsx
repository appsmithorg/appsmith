import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import TreeDropdown from "components/editorComponents/actioncreator/TreeDropdown";

import { AppState } from "reducers";
import { getNextEntityName } from "utils/AppsmithUtils";
import ContextMenuTrigger from "./Entity/ContextMenuTrigger";

import {
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/actionActions";

import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { ContextMenuPopoverModifiers } from "./ContextMenuHelpers";
import { noop } from "lodash";

const useNewAPIName = () => {
  // This takes into consideration only the current page widgets
  // If we're moving to a different page, there could be a widget
  // with the same name as the generated API name
  // TODO: Figure out how to handle this scenario
  const apiNames = useSelector((state: AppState) =>
    state.entities.actions.map(action => action.config.name),
  );
  return (name: string) =>
    apiNames.indexOf(name) > -1 ? getNextEntityName(name, apiNames) : name;
};

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
};
export const ActionEntityContextMenu = (props: EntityContextMenuProps) => {
  const { pageId } = useParams<{ pageId: string }>();
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
          originalPageId: pageId,
          name: nextEntityName(actionName),
        }),
      ),
    [dispatch, nextEntityName, pageId],
  );
  const deleteActionFromPage = useCallback(
    (actionId: string, actionName: string) =>
      dispatch(deleteAction({ id: actionId, name: actionName })),
    [dispatch],
  );

  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map(page => ({
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
          label: "Copy to",
          children: menuPages.map(page => {
            return {
              ...page,
              onSelect: () => copyActionToPage(props.id, props.name, page.id),
            };
          }),
        },
        {
          value: "move",
          onSelect: noop,
          label: "Move to",
          children: menuPages
            .filter(page => page.id !== pageId) // Remove current page from the list
            .map(page => {
              return {
                ...page,
                onSelect: () => moveActionToPage(props.id, props.name, page.id),
              };
            }),
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
