import React, { useCallback } from "react";
import Entity from "../Entity";
import { pageIcon } from "../ExplorerIcons";
import { noop } from "lodash";
import { useDispatch } from "react-redux";
import { getNextEntityName } from "utils/AppsmithUtils";
import { createPage } from "actions/pageActions";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { Page } from "constants/ReduxActionConstants";
import { WidgetTree } from "../Widgets/WidgetEntity";
import { GenericAction } from "entities/Action";
import ExplorerPageEntity from "./PageEntity";

type ExplorerPageGroupProps = {
  pages: Page[];
  widgets?: WidgetTree;
  actions: GenericAction[];
  currentPageId?: string;
  isFiltered: boolean;
  step: number;
};

export const ExplorerPageGroup = (props: ExplorerPageGroupProps) => {
  const dispatch = useDispatch();
  const params = useParams<ExplorerURLParams>();

  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      props.pages.map((page: Page) => page.pageName),
    );
    dispatch(createPage(params.applicationId, name));
  }, [dispatch, props.pages, params.applicationId]);

  return (
    <Entity
      name="Pages"
      icon={pageIcon}
      isDefaultExpanded
      action={noop}
      entityId="Pages"
      step={props.step}
      createFn={createPageCallback}
    >
      {props.pages.map((page: Page) => (
        <ExplorerPageEntity
          key={page.pageId}
          isCurrentPage={props.currentPageId === page.pageId}
          widgets={props.widgets}
          actions={props.actions}
          step={props.step + 1}
          isFiltered={props.isFiltered}
          page={page}
        />
      ))}
    </Entity>
  );
};

export default ExplorerPageGroup;
