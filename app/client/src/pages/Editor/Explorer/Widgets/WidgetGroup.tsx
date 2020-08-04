import React, { useMemo, memo } from "react";
import { useSelector } from "react-redux";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import { widgetIcon } from "../ExplorerIcons";
import WidgetEntity, { WidgetTree } from "./WidgetEntity";
import {
  WidgetTypes,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { AppState } from "reducers";

const getWidgetEntity = (
  entity: any,
  step: number,
  widgetsPageId: string,
  parentModalId?: string,
  searchKeyword?: string,
  widgetIdsToExpand?: string[],
) => {
  if (!entity) {
    if (searchKeyword) {
      return <React.Fragment />;
    } else {
      return;
    }
  }
  if (entity.type === WidgetTypes.CANVAS_WIDGET) {
    if (!entity.children || entity.children.length === 0) return;
    return entity.children.map((child: any) =>
      getWidgetEntity(
        child,
        step + 1,
        widgetsPageId,
        parentModalId,
        searchKeyword,
        widgetIdsToExpand,
      ),
    );
  }
  const childEntities =
    entity.children &&
    entity.children.length > 0 &&
    entity.children.map((child: any) =>
      getWidgetEntity(
        child,
        step,
        widgetsPageId,
        entity.type === WidgetTypes.MODAL_WIDGET ? entity.widgetId : undefined,
        searchKeyword,
        widgetIdsToExpand,
      ),
    );

  const shouldExpandWidgetEntity =
    widgetIdsToExpand && widgetIdsToExpand.indexOf(entity.widgetId) > -1
      ? true
      : undefined;
  return (
    <WidgetEntity
      widgetProps={entity}
      step={step}
      key={entity.widgetId}
      parentModalId={parentModalId}
      searchKeyword={searchKeyword}
      pageId={widgetsPageId}
      isDefaultExpanded={shouldExpandWidgetEntity}
    >
      {childEntities}
    </WidgetEntity>
  );
};

const useWidgetExpandList = (
  widgetPageId: string,
  currentPageId: string,
  selectedWidget?: string,
) => {
  const canvasWidgets = useSelector(
    (state: AppState) => state.entities.canvasWidgets,
  );

  return useMemo(() => {
    const widgetIdsExpandList = [];
    if (currentPageId === widgetPageId && !!selectedWidget) {
      // Make sure that the selected widget exists in canvasWidgets
      let widgetId = canvasWidgets[selectedWidget]
        ? canvasWidgets[selectedWidget].parentId
        : undefined;
      // If there is a parentId for the selectedWidget
      if (widgetId) {
        // Keep including the parent until we reach the main container
        while (widgetId !== MAIN_CONTAINER_WIDGET_ID) {
          widgetIdsExpandList.push(widgetId);
          widgetId = canvasWidgets[widgetId].parentId;
        }
      }
    }
    return widgetIdsExpandList;
  }, [canvasWidgets, widgetPageId, currentPageId, selectedWidget]);
};

type ExplorerWidgetGroupProps = {
  pageId: string;
  step: number;
  widgets: WidgetTree | null;
  searchKeyword?: string;
};

const StyledLink = styled(Link)`
  & {
    color: ${props => props.theme.colors.primary};
    &:hover {
      color: ${props => props.theme.colors.primary};
    }
  }
`;

export const ExplorerWidgetGroup = memo((props: ExplorerWidgetGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidget,
  );

  const widgetIdsExpandList = useWidgetExpandList(
    props.pageId,
    params.pageId,
    selectedWidget,
  );

  let childNode = getWidgetEntity(
    props.widgets,
    props.step,
    props.pageId,
    undefined,
    props.searchKeyword,
    widgetIdsExpandList,
  );
  if (!childNode && !props.searchKeyword) {
    childNode = (
      <EntityPlaceholder step={props.step + 1}>
        No widgets yet. Please{" "}
        {params.pageId !== props.pageId ? (
          <React.Fragment>
            <StyledLink
              to={BUILDER_PAGE_URL(params.applicationId, props.pageId)}
            >
              switch to this page
            </StyledLink>
            ,&nbsp;then&nbsp;
          </React.Fragment>
        ) : (
          "  "
        )}
        click the <strong>Widgets</strong> navigation menu icon on the left to
        drag and drop widgets
      </EntityPlaceholder>
    );
  }
  return (
    <Entity
      key={props.pageId + "_widgets"}
      icon={widgetIcon}
      className="group widgets"
      step={props.step}
      name="Widgets"
      disabled={!props.widgets && !!props.searchKeyword}
      entityId={props.pageId + "_widgets"}
      isDefaultExpanded={
        !!props.searchKeyword ||
        (params.pageId === props.pageId && !!selectedWidget)
      }
    >
      {childNode}
    </Entity>
  );
});

ExplorerWidgetGroup.displayName = "ExplorerWidgetGroup";

export default ExplorerWidgetGroup;
