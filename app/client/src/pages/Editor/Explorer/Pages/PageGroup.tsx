import React, { memo, useCallback } from "react";
import Entity from "../Entity";
import { pageGroupIcon } from "../ExplorerIcons";
import { noop } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { getNextEntityName } from "utils/AppsmithUtils";
import { createPage } from "actions/pageActions";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { Page } from "constants/ReduxActionConstants";
import ExplorerPageEntity from "./PageEntity";
import { AppState } from "reducers";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructure";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";

type ExplorerPageGroupProps = {
  searchKeyword?: string;
  step: number;
  widgets?: Record<string, CanvasStructure>;
  actions: Record<string, any[]>;
  datasources: Record<string, Datasource[]>;
  plugins: Plugin[];
  showWidgetsSidebar: (pageId: string) => void;
};

const pageGroupEqualityCheck = (
  prev: ExplorerPageGroupProps,
  next: ExplorerPageGroupProps,
) => {
  return (
    prev.widgets === next.widgets &&
    prev.actions === next.actions &&
    prev.datasources === next.datasources &&
    prev.searchKeyword === next.searchKeyword
  );
};

export const ExplorerPageGroup = memo((props: ExplorerPageGroupProps) => {
  const dispatch = useDispatch();
  const params = useParams<ExplorerURLParams>();

  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });
  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );
    dispatch(createPage(params.applicationId, name));
  }, [dispatch, pages, params.applicationId]);

  const pageEntities = pages.map((page) => {
    const pageWidgets = props.widgets && props.widgets[page.pageId];
    const pageActions = props.actions[page.pageId] || [];
    const datasources = props.datasources[page.pageId] || [];
    if (!pageWidgets && pageActions.length === 0 && datasources.length === 0)
      return null;
    return (
      <ExplorerPageEntity
        key={page.pageId}
        step={props.step + 1}
        widgets={pageWidgets}
        actions={pageActions}
        datasources={datasources}
        plugins={props.plugins}
        searchKeyword={props.searchKeyword}
        page={page}
        showWidgetsSidebar={props.showWidgetsSidebar}
      />
    );
  });

  if (pageEntities.filter(Boolean).length === 0) return null;

  return (
    <Entity
      name="Pages"
      className="group pages"
      icon={pageGroupIcon}
      isDefaultExpanded
      action={noop}
      entityId="Pages"
      step={props.step}
      onCreate={createPageCallback}
      searchKeyword={props.searchKeyword}
    >
      {pageEntities}
    </Entity>
  );
}, pageGroupEqualityCheck);

ExplorerPageGroup.displayName = "ExplorerPageGroup";

(ExplorerPageGroup as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default ExplorerPageGroup;
