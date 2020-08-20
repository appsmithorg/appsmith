import React, { useCallback } from "react";
import { Page } from "constants/ReduxActionConstants";
import { EntityClassNames } from "../Entity";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { updatePage } from "actions/pageActions";
import PageContextMenu from "./PageContextMenu";
import { useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import ExplorerCurrentPageEntity from "./CurrentPageEntity";
import ExplorerOtherPageEntity from "./OtherPageEntity";

type ExplorerPageEntityProps = {
  page: Page;
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

  if (isCurrentPage) {
    return (
      <ExplorerCurrentPageEntity
        searchKeyword={props.searchKeyword}
        page={props.page}
        switchPage={switchPage}
        contextMenu={contextMenu}
        updateEntityName={updatePage}
        step={props.step}
      />
    );
  }
  return (
    <ExplorerOtherPageEntity
      searchKeyword={props.searchKeyword}
      page={props.page}
      switchPage={switchPage}
      contextMenu={contextMenu}
      updateEntityName={updatePage}
      step={props.step}
    />
  );
};

ExplorerPageEntity.displayName = "ExplorerPageEntity";

export default ExplorerPageEntity;
