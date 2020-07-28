import React from "react";
import { Page } from "constants/ReduxActionConstants";
import { WidgetTree } from "../Widgets/WidgetEntity";
import { GenericAction } from "entities/Action";
import Entity, { EntityClassNames } from "../Entity";
import { pageIcon } from "../ExplorerIcons";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { getActionGroups } from "../Actions/helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { updatePage } from "actions/pageActions";
import PageContextMenu from "./PageContextMenu";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";

type ExplorerPageEntityProps = {
  page: Page;
  isCurrentPage: boolean;
  widgets?: WidgetTree;
  actions: GenericAction[];
  step: number;
  searchKeyword?: string;
};
export const ExplorerPageEntity = (props: ExplorerPageEntityProps) => {
  const params = useParams<ExplorerURLParams>();

  return (
    <Entity
      key={props.page.pageId}
      icon={pageIcon}
      name={props.page.pageName}
      step={props.step}
      action={() =>
        !props.isCurrentPage &&
        params.applicationId &&
        history.push(BUILDER_PAGE_URL(params.applicationId, props.page.pageId))
      }
      entityId={props.page.pageId}
      active={props.isCurrentPage}
      isDefaultExpanded={props.isCurrentPage || !!props.searchKeyword}
      updateEntityName={updatePage}
      contextMenu={
        <PageContextMenu
          applicationId={params.applicationId}
          pageId={props.page.pageId}
          name={props.page.pageName}
          className={EntityClassNames.ACTION_CONTEXT_MENU}
          isDefaultPage={props.page.isDefault}
        />
      }
    >
      {!(!props.widgets && props.searchKeyword) && (
        <ExplorerWidgetGroup
          step={props.step + 1}
          searchKeyword={props.searchKeyword}
          widgets={props.widgets || null}
          pageId={props.page.pageId}
        />
      )}
      {getActionGroups(
        props.page,
        props.actions,
        props.step + 1,
        props.searchKeyword,
      )}
    </Entity>
  );
};

export default ExplorerPageEntity;
