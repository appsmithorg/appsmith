import React, { useCallback } from "react";
import { Page } from "constants/ReduxActionConstants";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import Files from "../Files";

type ExplorerPageEntityProps = {
  page: Page;
  widgets?: CanvasStructure;
  actions: any[];
  datasources: Datasource[];
  plugins: Plugin[];
  step: number;
  searchKeyword?: string;
  showWidgetsSidebar: (pageId: string) => void;
  jsActions: JSCollectionData[];
};

export function ExplorerPageEntity(props: ExplorerPageEntityProps) {
  const addWidgetsFn = useCallback(
    () => props.showWidgetsSidebar(props.page.pageId),
    [props.page.pageId],
  );

  return (
    <div>
      <ExplorerWidgetGroup
        addWidgetsFn={addWidgetsFn}
        pageId={props.page.pageId}
        searchKeyword={props.searchKeyword}
        step={props.step + 1}
        widgets={props.widgets}
      />

      <Files />
    </div>
  );
}

ExplorerPageEntity.displayName = "ExplorerPageEntity";

export default ExplorerPageEntity;
