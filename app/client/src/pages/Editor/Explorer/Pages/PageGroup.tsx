import React, { memo } from "react";
import ExplorerPageEntity from "./PageEntity";
import { AppState } from "reducers";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { getCurrentPageId } from "selectors/editorSelectors";
import { useSelector } from "react-redux";

type ExplorerPageGroupProps = {
  searchKeyword?: string;
  step: number;
  widgets?: Record<string, CanvasStructure>;
  actions: Record<string, any[]>;
  datasources: Record<string, Datasource[]>;
  plugins: Plugin[];
  showWidgetsSidebar: (pageId: string) => void;
  jsActions: Record<string, JSCollectionData[]>;
};

const pageGroupEqualityCheck = (
  prev: ExplorerPageGroupProps,
  next: ExplorerPageGroupProps,
) => {
  return (
    prev.widgets === next.widgets &&
    prev.actions === next.actions &&
    prev.jsActions === next.jsActions &&
    prev.datasources === next.datasources &&
    prev.searchKeyword === next.searchKeyword
  );
};

export const ExplorerPageGroup = memo((props: ExplorerPageGroupProps) => {
  const currentSelectedPageId = useSelector(getCurrentPageId);

  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });

  const pageEntities = pages.map((page) => {
    const pageWidgets = props.widgets && props.widgets[page.pageId];
    const pageActions = props.actions[page.pageId] || [];
    const pageJSActions = props.jsActions[page.pageId] || [];
    const datasources = props.datasources[page.pageId] || [];
    if (
      (!pageWidgets && pageActions.length === 0 && datasources.length === 0) ||
      currentSelectedPageId !== page.pageId
    )
      return null;
    return (
      <ExplorerPageEntity
        actions={pageActions}
        datasources={datasources}
        jsActions={pageJSActions}
        key={page.pageId}
        page={page}
        plugins={props.plugins}
        searchKeyword={props.searchKeyword}
        showWidgetsSidebar={props.showWidgetsSidebar}
        step={props.step + 1}
        widgets={pageWidgets}
      />
    );
  });

  if (pageEntities.filter(Boolean).length === 0) return null;

  return <div>{pageEntities}</div>;
}, pageGroupEqualityCheck);

ExplorerPageGroup.displayName = "ExplorerPageGroup";

(ExplorerPageGroup as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default ExplorerPageGroup;
