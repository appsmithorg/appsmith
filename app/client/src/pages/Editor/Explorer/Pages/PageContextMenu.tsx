import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import TreeDropdown, {
  TreeDropdownOption,
} from "components/editorComponents/actioncreator/TreeDropdown";
import { noop } from "lodash";
import ContextMenuTrigger from "../ContextMenuTrigger";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ContextMenuPopoverModifiers } from "../helpers";
import { initExplorerEntityNameEdit } from "actions/explorerActions";

export const PageContextMenu = (props: {
  pageId: string;
  name: string;
  applicationId: string;
  className?: string;
  isDefaultPage: boolean;
}) => {
  const dispatch = useDispatch();

  const deletePage = useCallback(
    (pageId: string, pageName: string): void => {
      dispatch({
        type: ReduxActionTypes.DELETE_PAGE_INIT,
        payload: {
          id: pageId,
        },
      });
      AnalyticsUtil.logEvent("DELETE_PAGE", {
        pageName,
      });
    },
    [dispatch],
  );

  const setPageAsDefault = useCallback(
    (pageId: string, applicationId?: string): void => {
      dispatch({
        type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
        payload: {
          id: pageId,
          applicationId,
        },
      });
    },
    [dispatch],
  );

  const editPageName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(props.pageId)),
    [dispatch, props.pageId],
  );

  const optionTree: TreeDropdownOption[] = [
    {
      value: "rename",
      onSelect: editPageName,
      label: "Edit Name",
    },
  ];
  if (!props.isDefaultPage) {
    optionTree.push({
      value: "setdefault",
      onSelect: () => setPageAsDefault(props.pageId, props.applicationId),
      label: "Set as Home Page",
    });
  }
  optionTree.push({
    value: "delete",
    onSelect: () => deletePage(props.pageId, props.name),
    label: "Delete",
    intent: "danger",
  });
  return (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      selectedValue=""
      optionTree={optionTree}
      toggle={<ContextMenuTrigger />}
    />
  );
};

export default PageContextMenu;
