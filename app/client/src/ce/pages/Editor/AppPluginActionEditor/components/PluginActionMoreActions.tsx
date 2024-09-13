import React, { useCallback, useState } from "react";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { usePluginActionContext } from "PluginActionEditor";
import {
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from "@appsmith/ads";
import {
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONTEXT_MOVE,
  createMessage,
} from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import {
  copyActionRequest,
  deleteAction,
  moveActionRequest,
} from "actions/pluginActionActions";
import { getCurrentBasePageId } from "selectors/editorSelectors";

const Copy = () => {
  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map((page) => ({
      label: page.pageName,
      id: page.pageId,
      baseId: page.basePageId,
      value: page.pageName,
    }));
  });
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();
  const copyActionToPage = useCallback(
    (pageId: string) =>
      dispatch(
        copyActionRequest({
          id: action.id,
          destinationPageId: pageId,
          name: action.name,
        }),
      ),
    [action.id, action.name, dispatch],
  );
  return (
    <MenuSub>
      <MenuSubTrigger startIcon="duplicate">
        {createMessage(CONTEXT_COPY)}
      </MenuSubTrigger>
      <MenuSubContent>
        {menuPages.map((page) => {
          return (
            <MenuItem
              key={page.baseId}
              onSelect={() => copyActionToPage(page.id)}
            >
              {page.label}
            </MenuItem>
          );
        })}
      </MenuSubContent>
    </MenuSub>
  );
};

const Move = () => {
  const dispatch = useDispatch();
  const { action } = usePluginActionContext();
  const currentPageId = useSelector(getCurrentBasePageId);
  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages
      .filter((page) => page.pageId !== currentPageId)
      .map((page) => ({
        label: page.pageName,
        id: page.pageId,
        baseId: page.basePageId,
        value: page.pageName,
      }));
  });
  const moveActionToPage = useCallback(
    (destinationPageId: string) =>
      dispatch(
        moveActionRequest({
          id: action.id,
          destinationPageId,
          originalPageId: currentPageId,
          name: action.name,
        }),
      ),
    [dispatch, action.id, action.name, currentPageId],
  );
  return (
    <MenuSub>
      <MenuSubTrigger startIcon="swap-horizontal">
        {createMessage(CONTEXT_MOVE)}
      </MenuSubTrigger>
      <MenuSubContent>
        {menuPages.length > 1 ? (
          menuPages.map((page) => {
            return (
              <MenuItem
                key={page.baseId}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                onSelect={() => moveActionToPage(page.id)}
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
  );
};

const Delete = () => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();
  const { action } = usePluginActionContext();
  const deleteActionFromPage = useCallback(() => {
    dispatch(deleteAction({ id: action.id, name: action.name }));
    // Reset the delete confirmation state because it can navigate to another action
    // which will not remount this component
    setConfirmDelete(false);
  }, [dispatch]);
  return (
    <MenuItem
      className="t--apiFormDeleteBtn error-menuitem"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      onSelect={(e: Event) => {
        e.preventDefault();
        confirmDelete ? deleteActionFromPage() : setConfirmDelete(true);
      }}
      startIcon="trash"
    >
      {confirmDelete
        ? createMessage(CONFIRM_CONTEXT_DELETE)
        : createMessage(CONTEXT_DELETE)}
    </MenuItem>
  );
};

const AppPluginActionMenu = () => {
  const { action } = usePluginActionContext();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    action.userPermissions,
  );
  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );
  return (
    <>
      {isChangePermitted
        ? [
            <>
              <Copy />
              <Move />
            </>,
          ]
        : null}
      {isDeletePermitted ? <Delete /> : null}
    </>
  );
};

export default AppPluginActionMenu;
