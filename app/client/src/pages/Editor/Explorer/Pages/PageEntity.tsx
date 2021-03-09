import React, { useCallback } from "react";
import { Page } from "constants/ReduxActionConstants";
import Entity, { EntityClassNames } from "../Entity";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { updatePage } from "actions/pageActions";
import PageContextMenu from "./PageContextMenu";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { DataTreeAction } from "entities/DataTree/dataTreeFactory";
import { hiddenPageIcon, homePageIcon, pageIcon } from "../ExplorerIcons";
import { getPluginGroups } from "../Actions/helpers";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import { resolveAsSpaceChar } from "utils/helpers";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";

type ExplorerPageEntityProps = {
  page: Page;
  widgets?: CanvasStructure;
  actions: any[];
  datasources: Datasource[];
  plugins: Plugin[];
  step: number;
  searchKeyword?: string;
  showWidgetsSidebar: (pageId: string) => void;
};

export const ExplorerPageEntity = (props: ExplorerPageEntityProps) => {
  const params = useParams<ExplorerURLParams>();

  const currentPageId = useSelector((state: AppState) => {
    return state.entities.pageList.currentPageId;
  });
  const isCurrentPage = currentPageId === props.page.pageId;

  const switchPage = useCallback(() => {
    if (!!params.applicationId) {
      history.push(BUILDER_PAGE_URL(params.applicationId, props.page.pageId));
    }
  }, [props.page.pageId, params.applicationId]);

  const contextMenu = (
    <PageContextMenu
      key={props.page.pageId}
      applicationId={params.applicationId}
      pageId={props.page.pageId}
      name={props.page.pageName}
      className={EntityClassNames.CONTEXT_MENU}
      isDefaultPage={props.page.isDefault}
      isHidden={!!props.page.isHidden}
    />
  );

  const icon = props.page.isDefault ? homePageIcon : pageIcon;
  const rightIcon = !!props.page.isHidden ? hiddenPageIcon : null;

  const addWidgetsFn = useCallback(
    () => props.showWidgetsSidebar(props.page.pageId),
    [props.page.pageId],
  );

  return (
    <Entity
      icon={icon}
      name={props.page.pageName}
      className="page"
      step={props.step}
      action={switchPage}
      entityId={props.page.pageId}
      active={isCurrentPage}
      isDefaultExpanded={isCurrentPage || !!props.searchKeyword}
      updateEntityName={(id, name) =>
        updatePage(id, name, !!props.page.isHidden)
      }
      contextMenu={contextMenu}
      onNameEdit={resolveAsSpaceChar}
      rightIcon={rightIcon}
      searchKeyword={props.searchKeyword}
    >
      <ExplorerWidgetGroup
        step={props.step + 1}
        searchKeyword={props.searchKeyword}
        widgets={props.widgets}
        pageId={props.page.pageId}
        addWidgetsFn={addWidgetsFn}
      />

      {getPluginGroups(
        props.page,
        props.step + 1,
        props.actions as DataTreeAction[],
        props.datasources,
        props.plugins,
        props.searchKeyword,
      )}
    </Entity>
  );
};

ExplorerPageEntity.displayName = "ExplorerPageEntity";
(ExplorerPageEntity as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default ExplorerPageEntity;
