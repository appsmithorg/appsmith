import React, { useCallback, useMemo } from "react";
import Entity from "../Entity";
import { pageGroupIcon } from "../ExplorerIcons";
import { noop, compact } from "lodash";
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
  widgets?: (WidgetTree | undefined)[];
  actions: GenericAction[];
  currentPageId?: string;
  searchKeyword?: string;
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

  const pageEntityList = useMemo(
    () =>
      compact(
        props.pages.map((page: Page) => {
          const widgets = props.widgets?.find(
            (tree?: WidgetTree) => tree && tree.pageId === page.pageId,
          );
          const actions = props.actions.filter(
            (action: GenericAction & { pageId?: string }) =>
              action.pageId === page.pageId,
          );
          if (
            (!widgets || widgets.length === 0) &&
            actions.length === 0 &&
            props.searchKeyword
          ) {
            return null;
          }
          return { page, widgets, actions };
        }),
      ),
    [props.widgets, props.actions, props.pages, props.searchKeyword],
  );

  return (
    <Entity
      name="Pages"
      icon={pageGroupIcon}
      isDefaultExpanded
      action={noop}
      entityId="Pages"
      step={props.step}
      createFn={createPageCallback}
    >
      {pageEntityList.map(({ page, widgets, actions }) => {
        return (
          <ExplorerPageEntity
            key={page.pageId}
            isCurrentPage={props.currentPageId === page.pageId}
            widgets={widgets}
            actions={actions}
            step={props.step + 1}
            searchKeyword={props.searchKeyword}
            page={page}
          />
        );
      })}
    </Entity>
  );
};

export default ExplorerPageGroup;
