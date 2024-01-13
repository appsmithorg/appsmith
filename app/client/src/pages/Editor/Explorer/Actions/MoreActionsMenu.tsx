import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppState } from "@appsmith/reducers";

import {
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/pluginActionActions";

import { useNewActionName } from "./helpers";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_MOVE,
  createMessage,
} from "@appsmith/constants/messages";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "design-system";
import { useToggle } from "@mantine/hooks";

interface EntityContextMenuProps {
  id: string;
  name: string;
  className?: string;
  pageId: string;
  isChangePermitted?: boolean;
  isDeletePermitted?: boolean;
}

export function MoreActionsMenu(props: EntityContextMenuProps) {
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);
  const nextEntityName = useNewActionName();
  const guidedTourEnabled = useSelector(inGuidedTour);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { isChangePermitted = false, isDeletePermitted = false } = props;

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
    (actionId: string, actionName: string) => {
      if (guidedTourEnabled) {
        dispatch(toggleShowDeviationDialog(true));
        return;
      }

      dispatch(deleteAction({ id: actionId, name: actionName }));
    },
    [dispatch, guidedTourEnabled],
  );

  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map((page) => ({
      label: page.pageName,
      id: page.pageId,
      value: page.pageName,
    }));
  });

  return isChangePermitted || isDeletePermitted ? (
    <Menu
      className={props.className}
      onOpenChange={() => toggleMenuOpen()}
      open={isMenuOpen}
    >
      <MenuTrigger>
        <Button
          data-testid="more-action-trigger"
          isIconButton
          kind="tertiary"
          size="md"
          startIcon="context-menu"
        />
      </MenuTrigger>
      <MenuContent loop style={{ zIndex: 100 }} width="200px">
        {isChangePermitted && (
          <MenuSub>
            <MenuSubTrigger startIcon="duplicate">
              {createMessage(CONTEXT_COPY)}
            </MenuSubTrigger>
            <MenuSubContent>
              {menuPages.map((page) => {
                return (
                  <MenuItem
                    key={page.id}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    onSelect={() =>
                      copyActionToPage(props.id, props.name, page.id)
                    }
                  >
                    {page.label}
                  </MenuItem>
                );
              })}
            </MenuSubContent>
          </MenuSub>
        )}
        {isChangePermitted && (
          <MenuSub>
            <MenuSubTrigger startIcon="swap-horizontal">
              {createMessage(CONTEXT_MOVE)}
            </MenuSubTrigger>
            <MenuSubContent>
              {/* Isn't it better ux to perform this check outside the menu and then simply not show the option?*/}
              {menuPages.length > 1 ? (
                menuPages
                  .filter((page) => page.id !== props.pageId) // Remove current page from the list
                  .map((page) => {
                    return (
                      <MenuItem
                        key={page.id}
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        onSelect={() =>
                          moveActionToPage(props.id, props.name, page.id)
                        }
                      >
                        {page.label}
                      </MenuItem>
                    );
                  })
              ) : (
                <MenuItem key="no-pages">No pages</MenuItem>
              )}
            </MenuSubContent>
          </MenuSub>
        )}
        {isDeletePermitted && (
          <MenuItem
            className="t--apiFormDeleteBtn error-menuitem"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            onSelect={(e: Event) => {
              e.preventDefault();
              confirmDelete
                ? deleteActionFromPage(props.id, props.name)
                : setConfirmDelete(true);
            }}
            startIcon="trash"
          >
            {confirmDelete
              ? createMessage(CONFIRM_CONTEXT_DELETE)
              : createMessage(CONTEXT_DELETE)}
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  ) : null;
}

export default MoreActionsMenu;
