import React, { useCallback } from "react";
import { Page } from "constants/ReduxActionConstants";
import { DataTreeAction } from "entities/DataTree/dataTreeFactory";
import { getPluginGroups } from "../Actions/helpers";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import ExplorerJSCollectionGroup from "../JSActions/JSActionGroup";
import getFeatureFlags from "utils/featureFlags";
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
  const isJSEditorEnabled = getFeatureFlags().JS_EDITOR;

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

      {/* {getPluginGroups(
        props.page,
        props.step + 1,
        props.actions as DataTreeAction[],
        props.datasources,
        props.plugins,
        props.searchKeyword,
      )}

      {isJSEditorEnabled && (
        <ExplorerJSCollectionGroup
          jsActions={props.jsActions}
          pageId={props.page.pageId}
          searchKeyword={props.searchKeyword}
          step={props.step + 1}
        />
      )} */}
    </div>
  );
}

ExplorerPageEntity.displayName = "ExplorerPageEntity";

export default ExplorerPageEntity;
