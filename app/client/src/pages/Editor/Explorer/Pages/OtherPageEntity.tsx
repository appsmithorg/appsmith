import React, { ReactNode } from "react";
import { pageIcon, homePageIcon } from "../ExplorerIcons";
import Entity from "../Entity";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import { getActionGroups } from "../Actions/helpers";
import { Page } from "constants/ReduxActionConstants";
import { usePageWidgets, usePageActions } from "../hooks";
import { DataTreeAction } from "entities/DataTree/dataTreeFactory";

type ExplorerOtherPageEntityProps = {
  page: Page;
  step: number;
  searchKeyword?: string;
  switchPage: () => void;
  contextMenu: ReactNode;
  updateEntityName: (id: string, name: string) => any;
};

export const ExplorerOtherPageEntity = (
  props: ExplorerOtherPageEntityProps,
) => {
  const actions = usePageActions(props.page.pageId, props.searchKeyword);
  const widgets = usePageWidgets(props.page.pageId, props.searchKeyword);
  const icon = props.page.isDefault ? homePageIcon : pageIcon;
  if (props.searchKeyword && !widgets && actions.length === 0) return null;

  return (
    <Entity
      icon={icon}
      name={props.page.pageName}
      className="page"
      step={props.step}
      action={props.switchPage}
      entityId={props.page.pageId}
      isDefaultExpanded={!!props.searchKeyword}
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

export default ExplorerOtherPageEntity;
