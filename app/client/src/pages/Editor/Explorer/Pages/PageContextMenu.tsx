import React, { ReactNode, useCallback } from "react";
import { useDispatch } from "react-redux";
import TreeDropdown, {
  TreeDropdownOption,
} from "pages/Editor/Explorer/TreeDropdown";
import { noop } from "lodash";
import ContextMenuTrigger from "../ContextMenuTrigger";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ContextMenuPopoverModifiers } from "../helpers";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  clonePageInit,
  deletePage,
  setPageAsDefault,
  updatePage,
} from "actions/pageActions";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";

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
  const clonePage = useCallback(() => dispatch(clonePageInit(props.pageId)), [
    dispatch,
    props.pageId,
  ]);

  /**
   * sets the page hidden
   *
   * @return void
   */
  const setHiddenField = useCallback(
    () => dispatch(updatePage(props.pageId, props.name, !props.isHidden)),
    [dispatch, props.pageId, props.name, props.isHidden],
  );

  const optionTree: TreeDropdownOption[] = [
    {
      value: "rename",
      onSelect: editPageName,
      label: "Edit Name",
    },
    {
      value: "clone",
      onSelect: clonePage,
      label: "Clone",
    },
    {
      value: "visibility",
      onSelect: setHiddenField,
      // Possibly support ReactNode in TreeOption
      label: ((
        <CustomLabel>
          {props.isHidden ? "Show" : "Hide"}
          <Icon icon={props.isHidden ? "eye-open" : "eye-off"} iconSize={14} />
        </CustomLabel>
      ) as ReactNode) as string,
    },
  ];
  if (!props.isDefaultPage) {
    optionTree.push({
      value: "setdefault",
      onSelect: setPageAsDefaultCallback,
      label: "Set as Home Page",
    });
  }

  if (!props.isDefaultPage) {
    optionTree.push({
      value: "delete",
      onSelect: deletePageCallback,
      label: "Delete",
      intent: "danger",
    });
  }
  return (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      optionTree={optionTree}
      selectedValue=""
      toggle={<ContextMenuTrigger className="t--context-menu" />}
    />
  );
}

export default PageContextMenu;
