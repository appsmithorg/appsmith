import React, { useCallback, useMemo, useState } from "react";
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
import {
  copyActionRequest,
  deleteAction,
  moveActionRequest,
} from "actions/pluginActionActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { Page } from "entities/Page";
import { getPageList } from "ee/selectors/entitiesSelector";
import { ConvertToModuleCTA } from "./ConvertToModule";

const PageMenuItem = (props: {
  page: Page;
  onSelect: (id: string) => void;
}) => {
  const handleOnSelect = useCallback(() => {
    props.onSelect(props.page.pageId);
  }, [props]);
  return <MenuItem onSelect={handleOnSelect}>{props.page.pageName}</MenuItem>;
};

const Copy = () => {
  const menuPages = useSelector(getPageList);
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
            <PageMenuItem
              key={page.basePageId}
              onSelect={copyActionToPage}
              page={page}
            />
          );
        })}
      </MenuSubContent>
    </MenuSub>
  );
};

const Move = () => {
  const dispatch = useDispatch();
  const { action } = usePluginActionContext();

  const currentPageId = useSelector(getCurrentPageId);
  const allPages = useSelector(getPageList);
  const menuPages = useMemo(() => {
    return allPages.filter((page) => page.pageId !== currentPageId);
  }, [allPages, currentPageId]);

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
              <PageMenuItem
                key={page.basePageId}
                onSelect={moveActionToPage}
                page={page}
              />
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
  const dispatch = useDispatch();
  const { action } = usePluginActionContext();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteActionFromPage = useCallback(() => {
    dispatch(deleteAction({ id: action.id, name: action.name }));
  }, [action.id, action.name, dispatch]);

  const handleSelect = useCallback(() => {
    confirmDelete ? deleteActionFromPage() : setConfirmDelete(true);
  }, [confirmDelete, deleteActionFromPage]);

  const menuLabel = confirmDelete
    ? createMessage(CONFIRM_CONTEXT_DELETE)
    : createMessage(CONTEXT_DELETE);

  return (
    <MenuItem
      className="t--apiFormDeleteBtn error-menuitem"
      onSelect={handleSelect}
      startIcon="trash"
    >
      {menuLabel}
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
      <ConvertToModuleCTA />
      {isChangePermitted && (
        <>
          <Copy />
          <Move />
        </>
      )}
      {isDeletePermitted && <Delete />}
    </>
  );
};

export default AppPluginActionMenu;
