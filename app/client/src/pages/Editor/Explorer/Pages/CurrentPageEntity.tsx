import React, { ReactNode } from "react";
import { homePageIcon, pageIcon } from "../ExplorerIcons";
import Entity from "../Entity";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import { getActionGroups } from "../Actions/helpers";
import { Page } from "constants/ReduxActionConstants";
import { useDataTreeWidgets, useDataTreeActions } from "../hooks";
import { DataTreeAction } from "entities/DataTree/dataTreeFactory";

type ExplorerCurrentPageEntityProps = {
  page: Page;
  step: number;
  searchKeyword?: string;
  switchPage: () => void;
  contextMenu: ReactNode;
  updateEntityName: (id: string, name: string) => any;
};

export const ExplorerCurrentPageEntity = (
  props: ExplorerCurrentPageEntityProps,
) => {
  const actions = useDataTreeActions(props.searchKeyword);
  const widgets = useDataTreeWidgets(props.searchKeyword);
  const icon = props.page.isDefault ? homePageIcon : pageIcon;

  return (
    <Entity
      icon={icon}
      name={props.page.pageName}
      className="page"
      step={props.step}
      action={props.switchPage}
      entityId={props.page.pageId}
      active
      isDefaultExpanded
      updateEntityName={props.updateEntityName}
      contextMenu={props.contextMenu}
    >
      <ExplorerWidgetGroup
        step={props.step + 1}
        searchKeyword={props.searchKeyword}
        widgets={widgets}
        pageId={props.page.pageId}
      />

      {getActionGroups(
        props.page,
        props.step + 1,
        actions as DataTreeAction[],
        props.searchKeyword,
      )}
    </Entity>
  );
};

export default ExplorerCurrentPageEntity;
