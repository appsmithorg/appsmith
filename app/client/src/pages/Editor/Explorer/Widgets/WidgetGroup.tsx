import React, { useMemo, memo, ReactNode } from "react";
import { useSelector } from "react-redux";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import { widgetIcon } from "../ExplorerIcons";
import WidgetEntity from "./WidgetEntity";
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
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructure";

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
          if (canvasWidgets[widgetId] && canvasWidgets[widgetId].parentId)
            widgetId = canvasWidgets[widgetId].parentId;
          else break;
        }
      }
    }
    return widgetIdsExpandList;
  }, [canvasWidgets, widgetPageId, currentPageId, selectedWidget]);
};

type ExplorerWidgetGroupProps = {
  pageId: string;
  step: number;
  widgets?: CanvasStructure;
  searchKeyword?: string;
  addWidgetsFn?: () => void;
};

const StyledLink = styled(Link)`
  & {
    color: ${props => props.theme.colors.primary};
    &:hover {
      color: ${props => props.theme.colors.primary};
    }
  }
`;

export const ExplorerWidgetGroup = (props: ExplorerWidgetGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidget,
  );

  // const widgetIdsExpandList = useWidgetExpandList(
  //   props.pageId,
  //   params.pageId,
  //   selectedWidget,
  // );

  const childNode = (
    <EntityPlaceholder step={props.step + 1}>
      No widgets yet. Please{" "}
      {params.pageId !== props.pageId ? (
        <React.Fragment>
          <StyledLink to={BUILDER_PAGE_URL(params.applicationId, props.pageId)}>
            switch to this page
          </StyledLink>
          ,&nbsp;then&nbsp;
        </React.Fragment>
      ) : (
        "  "
      )}
      click the <strong>+</strong> icon on the <strong>Widgets</strong> group to
      drag and drop widgets
    </EntityPlaceholder>
  );

  return (
    <Entity
      key={props.pageId + "_widgets"}
      icon={widgetIcon}
      className={`group widgets ${props.addWidgetsFn ? "current" : ""}`}
      step={props.step}
      name="Widgets"
      disabled={!props.widgets && !!props.searchKeyword}
      entityId={props.pageId + "_widgets"}
      isDefaultExpanded={
        !!props.searchKeyword ||
        (params.pageId === props.pageId && !!selectedWidget)
      }
      onCreate={props.addWidgetsFn}
      searchKeyword={props.searchKeyword}
    >
      {props.widgets?.children?.map(child => (
        <WidgetEntity
          widgetId={child.widgetId}
          widgetName={child.widgetName}
          widgetType={child.type}
          childWidgets={child.children}
          step={props.step + 1}
          key={child.widgetId}
          searchKeyword={props.searchKeyword}
          pageId={props.pageId}
        />
      ))}
      {!props.widgets?.children && !props.searchKeyword && childNode}
    </Entity>
  );
};

ExplorerWidgetGroup.displayName = "ExplorerWidgetGroup";
ExplorerWidgetGroup.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default ExplorerWidgetGroup;
