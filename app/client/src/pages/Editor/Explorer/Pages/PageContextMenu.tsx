import type { ReactNode } from "react";
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  clonePageInit,
  deletePageAction,
  setPageAsDefault,
  updatePageAction,
} from "actions/pageActions";
import styled from "styled-components";
import { Icon } from "@appsmith/ads";
import {
  CONTEXT_RENAME,
  CONTEXT_CLONE,
  CONTEXT_SET_AS_HOME_PAGE,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
  CONTEXT_PARTIAL_EXPORT,
  CONTEXT_PARTIAL_IMPORT,
} from "ee/constants/messages";
import { getPageById } from "selectors/editorSelectors";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { AppState } from "ee/reducers";
import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasCreatePagePermission,
  getHasDeletePagePermission,
  getHasManagePagePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { openPartialExportModal } from "actions/widgetActions";
import { openPartialImportModal } from "ee/actions/applicationActions";

const CustomLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export function PageContextMenu(props: {
  pageId: string;
  name: string;
  applicationId: string;
  className?: string;
  isCurrentPage: boolean;
  isDefaultPage: boolean;
  isHidden: boolean;
  hasExportPermission: boolean;
  onItemSelected?: () => void;
}) {
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  /**
   * delete the page
   *
   * @return void
   */
  const deletePageCallback = useCallback((): void => {
    dispatch(deletePageAction(props.pageId));
    AnalyticsUtil.logEvent("DELETE_PAGE", {
      pageName: props.name,
    });
  }, [dispatch]);

  /**
   * sets the page as default
   *
   * @return void
   */
  const setPageAsDefaultCallback = useCallback((): void => {
    dispatch(setPageAsDefault(props.pageId, props.applicationId));
  }, [dispatch]);

  /**
   * edit the page name
   *
   * @return void
   */
  const editPageName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(props.pageId)),
    [dispatch, props.pageId],
  );

  /**
   * clone the page
   *
   * @return void
   */
  const clonePage = useCallback(
    () => dispatch(clonePageInit(props.pageId)),
    [dispatch, props.pageId],
  );

  /**
   * sets the page hidden
   *
   * @return void
   */
  const setHiddenField = useCallback(
    () =>
      dispatch(
        updatePageAction({
          id: props.pageId,
          name: props.name,
          isHidden: !props.isHidden,
        }),
      ),
    [dispatch, props.pageId, props.name, props.isHidden],
  );

  const showPartialImportExportInMenu = useMemo(
    () => props.hasExportPermission && props.isCurrentPage,
    [props.hasExportPermission, props.isCurrentPage],
  );

  const handlePartialExportClick = () => {
    if (props.onItemSelected) props.onItemSelected();

    dispatch(openPartialExportModal(true));
  };
  const handlePartialImportClick = () => {
    if (props.onItemSelected) props.onItemSelected();

    dispatch(openPartialImportModal(true));
  };

  const pagePermissions =
    useSelector(getPageById(props.pageId))?.userPermissions || [];

  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreatePages = getHasCreatePagePermission(
    isFeatureEnabled,
    userAppPermissions,
  );

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const canDeletePages = getHasDeletePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const optionsTree = [
    canManagePages && {
      value: "rename",
      onSelect: editPageName,
      label: createMessage(CONTEXT_RENAME),
    },
    canCreatePages &&
      canManagePages && {
        value: "clone",
        onSelect: clonePage,
        label: createMessage(CONTEXT_CLONE),
      },
    canManagePages && {
      value: "visibility",
      onSelect: setHiddenField,
      // Possibly support ReactNode in TreeOption
      label: (
        <CustomLabel>
          {props.isHidden ? "Show" : "Hide"}
          <Icon name={props.isHidden ? "eye-on" : "eye-off"} size="md" />
        </CustomLabel>
      ) as ReactNode as string,
    },
    !props.isDefaultPage &&
      canManagePages && {
        value: "setdefault",
        onSelect: setPageAsDefaultCallback,
        label: createMessage(CONTEXT_SET_AS_HOME_PAGE),
      },
    props.isDefaultPage &&
      canManagePages && {
        className: "!text-[color:var(--appsmith-color-black-500)]",
        disabled: true,
        value: "setdefault",
        label: createMessage(CONTEXT_SET_AS_HOME_PAGE),
      },
    showPartialImportExportInMenu && {
      value: "partial-export",
      onSelect: handlePartialExportClick,
      label: createMessage(CONTEXT_PARTIAL_EXPORT),
    },
    showPartialImportExportInMenu && {
      value: "partial-import",
      onSelect: handlePartialImportClick,
      label: createMessage(CONTEXT_PARTIAL_IMPORT),
    },
    !props.isDefaultPage &&
      canDeletePages && {
        className: "t--apiFormDeleteBtn single-select",
        confirmDelete: confirmDelete,
        value: "delete",
        onSelect: () => {
          confirmDelete ? deletePageCallback() : setConfirmDelete(true);
        },
        label: confirmDelete
          ? createMessage(CONFIRM_CONTEXT_DELETE)
          : createMessage(CONTEXT_DELETE),
        intent: "danger",
      },
  ].filter(Boolean);

  return optionsTree?.length > 0 ? (
    <ContextMenu
      className={props.className}
      optionTree={optionsTree as TreeDropdownOption[]}
      setConfirmDelete={setConfirmDelete}
    />
  ) : null;
}

export default PageContextMenu;
