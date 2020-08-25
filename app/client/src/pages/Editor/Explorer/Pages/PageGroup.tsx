import React, { useCallback } from "react";
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
import { AppState } from "@appsmith/reducers";
import { useActions, useWidgets } from "../hooks";

type ExplorerPageGroupProps = {
  searchKeyword?: string;
  step: number;
};

export const ExplorerPageGroup = (props: ExplorerPageGroupProps) => {
  const dispatch = useDispatch();
  const params = useParams<ExplorerURLParams>();
  const widgets = useWidgets(props.searchKeyword);
  const actions = useActions(props.searchKeyword);
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

  const pageEntities = pages.map(page => {
    const pageWidgets = widgets[page.pageId];
    const pageActions = actions[page.pageId];
    return (
      <ExplorerPageEntity
        key={page.pageId}
        step={props.step + 1}
        widgets={pageWidgets}
        actions={pageActions}
        searchKeyword={props.searchKeyword}
        page={page}
      />
    );
  });

  return (
    <Entity
      name="Pages"
      className="group pages"
      icon={pageGroupIcon}
      isDefaultExpanded
      action={noop}
      entityId="Pages"
      step={props.step}
      createFn={createPageCallback}
    >
      {pageEntities}
    </Entity>
  );
};

export default ExplorerPageGroup;
