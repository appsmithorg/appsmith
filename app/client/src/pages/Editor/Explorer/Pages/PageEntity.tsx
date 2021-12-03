import React, { useCallback } from "react";
import { Page } from "constants/ReduxActionConstants";
import Entity, { EntityClassNames } from "../Entity";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { updatePage } from "actions/pageActions";
import PageContextMenu from "./PageContextMenu";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { DataTreeAction } from "entities/DataTree/dataTreeFactory";
import { hiddenPageIcon, pageIcon, defaultPageIcon } from "../ExplorerIcons";
import { getPluginGroups } from "../Actions/helpers";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import { resolveAsSpaceChar } from "utils/helpers";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import ExplorerJSCollectionGroup from "../JSActions/JSActionGroup";
import getFeatureFlags from "utils/featureFlags";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { getCurrentApplicationId } from "selectors/editorSelectors";

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
  const currentPageId = useSelector((state: AppState) => {
    return state.entities.pageList.currentPageId;
  });
  const isCurrentPage = currentPageId === props.page.pageId;

  const currenApplicationId = useSelector(getCurrentApplicationId);
  const applicationId = useSelector(getCurrentApplicationId);

  const switchPage = useCallback(() => {
    if (!!applicationId) {
      history.push(
        BUILDER_PAGE_URL({ applicationId, pageId: props.page.pageId }),
      );
    }
  }, [props.page.pageId, applicationId]);

  const isJSEditorEnabled = getFeatureFlags().JS_EDITOR;

  const contextMenu = (
    <PageContextMenu
      applicationId={currenApplicationId as string}
      className={EntityClassNames.CONTEXT_MENU}
      isDefaultPage={props.page.isDefault}
      isHidden={!!props.page.isHidden}
      key={props.page.pageId}
      name={props.page.pageName}
      pageId={props.page.pageId}
    />
  );

  const icon = props.page.isDefault ? defaultPageIcon : pageIcon;
  const rightIcon = !!props.page.isHidden ? hiddenPageIcon : null;

  const addWidgetsFn = useCallback(
    () => props.showWidgetsSidebar(props.page.pageId),
    [props.page.pageId],
  );

  return (
    <Entity
      action={switchPage}
      active={isCurrentPage}
      className="page"
      contextMenu={contextMenu}
      entityId={props.page.pageId}
      icon={icon}
      isDefaultExpanded={isCurrentPage || !!props.searchKeyword}
      name={props.page.pageName}
      onNameEdit={resolveAsSpaceChar}
      rightIcon={rightIcon}
      searchKeyword={props.searchKeyword}
      step={props.step}
      updateEntityName={(id, name) =>
        updatePage(id, name, !!props.page.isHidden)
      }
    >
      <ExplorerWidgetGroup
        addWidgetsFn={addWidgetsFn}
        pageId={props.page.pageId}
        searchKeyword={props.searchKeyword}
        step={props.step + 1}
        widgets={props.widgets}
      />

      {getPluginGroups(
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
      )}
    </Entity>
  );
}

ExplorerPageEntity.displayName = "ExplorerPageEntity";

export default ExplorerPageEntity;
