import type { ReactNode } from "react";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  clonePageInit,
  deletePage,
  setPageAsDefault,
  updatePage,
} from "actions/pageActions";
import styled from "styled-components";
import { Icon } from "design-system";
import {
  CONTEXT_EDIT_NAME,
  CONTEXT_CLONE,
  CONTEXT_SET_AS_HOME_PAGE,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
  CONTEXT_SETTINGS,
} from "@appsmith/constants/messages";
import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { getPageById } from "selectors/editorSelectors";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import type { AppState } from "@appsmith/reducers";
import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasCreatePagePermission,
  getHasDeletePagePermission,
  getHasManagePagePermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

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
  isDefaultPage: boolean;
  isHidden: boolean;
}) {
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  /**
   * delete the page
   *
   * @return void
   */
  const deletePageCallback = useCallback((): void => {
    dispatch(deletePage(props.pageId));
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
        updatePage({
          id: props.pageId,
          name: props.name,
          isHidden: !props.isHidden,
        }),
      ),
    [dispatch, props.pageId, props.name, props.isHidden],
  );

  const openAppSettingsPane = () =>
    dispatch(
      openAppSettingsPaneAction({
        type: AppSettingsTabs.Page,
        pageId: props.pageId,
      }),
    );

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
      label: createMessage(CONTEXT_EDIT_NAME),
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
    {
      value: "settings",
      onSelect: openAppSettingsPane,
      label: createMessage(CONTEXT_SETTINGS),
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
