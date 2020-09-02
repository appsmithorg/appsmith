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
import { WidgetProps } from "widgets/BaseWidget";
import { DataTreeAction } from "entities/DataTree/dataTreeFactory";
import { homePageIcon, pageIcon } from "../ExplorerIcons";
import { getActionGroups } from "../Actions/helpers";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import { resolveAsSpaceChar } from "utils/helpers";

type ExplorerPageEntityProps = {
  page: Page;
  widgets?: WidgetProps;
  actions: any[];
  step: number;
  searchKeyword?: string;
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
    />
  );

  const icon = props.page.isDefault ? homePageIcon : pageIcon;
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
      updateEntityName={updatePage}
      contextMenu={contextMenu}
      nameTransformFn={resolveAsSpaceChar}
    >
      <ExplorerWidgetGroup
        step={props.step + 1}
        searchKeyword={props.searchKeyword}
        widgets={props.widgets}
        pageId={props.page.pageId}
      />

      {getActionGroups(
        props.page,
        props.step + 1,
        props.actions as DataTreeAction[],
        props.searchKeyword,
      )}
    </Entity>
  );
};

ExplorerPageEntity.displayName = "ExplorerPageEntity";

export default ExplorerPageEntity;
