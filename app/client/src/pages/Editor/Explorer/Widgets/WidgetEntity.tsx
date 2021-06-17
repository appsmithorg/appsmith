import React, { useMemo, useCallback, memo } from "react";
import Entity, { EntityClassNames } from "../Entity";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetTypes, WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getWidgetIcon } from "../ExplorerIcons";

import WidgetContextMenu from "./WidgetContextMenu";
import { updateWidgetName } from "actions/propertyPaneActions";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import EntityProperties from "../Entity/EntityProperties";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import CurrentPageEntityProperties from "../Entity/CurrentPageEntityProperties";
import { getSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { useNavigateToWidget } from "./useNavigateToWidget";

export type WidgetTree = WidgetProps & { children?: WidgetTree[] };

const UNREGISTERED_WIDGETS: WidgetType[] = [WidgetTypes.ICON_WIDGET];

const useWidget = (
  widgetId: string,
  widgetType: WidgetType,
  pageId: string,
  widgetsInStep: string[],
  parentModalId?: string,
) => {
  const selectedWidgets = useSelector(getSelectedWidgets);
  const lastSelectedWidget = useSelector(getSelectedWidget);
  const isWidgetSelected = useMemo(
    () => selectedWidgets && selectedWidgets.includes(widgetId),
    [selectedWidgets, widgetId],
  );

  const multipleWidgetsSelected = selectedWidgets && selectedWidgets.length > 1;

  const { navigateToWidget } = useNavigateToWidget();

  const boundNavigateToWidget = useCallback(
    (e: any) => {
      const isMultiSelect = e.metaKey || e.ctrlKey;
      const isShiftSelect = e.shiftKey;
      navigateToWidget(
        widgetId,
        widgetType,
        pageId,
        isWidgetSelected,
        parentModalId,
        isMultiSelect,
        isShiftSelect,
        widgetsInStep,
      );
    },
    [
      widgetId,
      widgetType,
      pageId,
      isWidgetSelected,
      parentModalId,
      widgetsInStep,
      navigateToWidget,
    ],
  );

  return {
    navigateToWidget: boundNavigateToWidget,
    isWidgetSelected,
    multipleWidgetsSelected,
    lastSelectedWidget,
  };
};

export type WidgetEntityProps = {
  widgetId: string;
  widgetName: string;
  widgetType: WidgetType;
  step: number;
  pageId: string;
  childWidgets?: CanvasStructure[];
  parentModalId?: string;
  searchKeyword?: string;
  isDefaultExpanded?: boolean;
  widgetsInStep: string[];
};

export const WidgetEntity = memo((props: WidgetEntityProps) => {
  const { pageId } = useParams<ExplorerURLParams>();
  const widgetsToExpand = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgetAncestory,
  );
  let shouldExpand = false;
  if (widgetsToExpand.includes(props.widgetId)) shouldExpand = true;
  const {
    isWidgetSelected,
    lastSelectedWidget,
    multipleWidgetsSelected,
    navigateToWidget,
  } = useWidget(
    props.widgetId,
    props.widgetType,
    props.pageId,
    props.widgetsInStep,
    props.parentModalId,
  );

  const { parentModalId, widgetId, widgetType } = props;
  /**
   * While navigating to a widget we need to show a modal if the widget is nested within it
   * Since the immediate parent for the widget would be a canvas instead of the modal,
   * so we track the immediate modal parent for the widget
   */
  const parentModalIdForChildren = useMemo(() => {
    return widgetType === "MODAL_WIDGET" ? widgetId : parentModalId;
  }, [widgetType, widgetId, parentModalId]);

  if (UNREGISTERED_WIDGETS.indexOf(props.widgetType) > -1) return null;

  const contextMenu = (
    <WidgetContextMenu
      className={EntityClassNames.CONTEXT_MENU}
      pageId={props.pageId}
      widgetId={props.widgetId}
    />
  );

  const showContextMenu = props.pageId === pageId && !multipleWidgetsSelected;
  const widgetsInStep = props?.childWidgets
    ? props?.childWidgets?.map((child) => child.widgetId)
    : [];

  return (
    <Entity
      action={navigateToWidget}
      active={isWidgetSelected}
      className="widget"
      contextMenu={showContextMenu && contextMenu}
      entityId={props.widgetId}
      highlight={lastSelectedWidget === props.widgetId}
      icon={getWidgetIcon(props.widgetType)}
      isDefaultExpanded={
        shouldExpand ||
        (!!props.searchKeyword && !!props.childWidgets) ||
        !!props.isDefaultExpanded
      }
      key={props.widgetId}
      name={props.widgetName}
      searchKeyword={props.searchKeyword}
      step={props.step}
      updateEntityName={props.pageId === pageId ? updateWidgetName : undefined}
    >
      {props.childWidgets &&
        props.childWidgets.length > 0 &&
        props.childWidgets.map((child) => (
          <WidgetEntity
            childWidgets={child.children}
            key={child.widgetId}
            pageId={props.pageId}
            parentModalId={parentModalIdForChildren}
            searchKeyword={props.searchKeyword}
            step={props.step + 1}
            widgetId={child.widgetId}
            widgetName={child.widgetName}
            widgetType={child.type}
            widgetsInStep={widgetsInStep}
          />
        ))}
      {!(props.childWidgets && props.childWidgets.length > 0) &&
        pageId === props.pageId && (
          <CurrentPageEntityProperties
            entityName={props.widgetName}
            entityType={ENTITY_TYPE.WIDGET}
            key={props.widgetId}
            step={props.step + 1}
          />
        )}
      {!(props.childWidgets && props.childWidgets.length > 0) &&
        pageId !== props.pageId && (
          <EntityProperties
            entityId={props.widgetId}
            entityName={props.widgetName}
            entityType={ENTITY_TYPE.WIDGET}
            key={props.widgetId}
            pageId={props.pageId}
            step={props.step + 1}
          />
        )}
    </Entity>
  );
});

WidgetEntity.displayName = "WidgetEntity";

(WidgetEntity as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default WidgetEntity;
