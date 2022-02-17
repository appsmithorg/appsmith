import React, { useMemo, useCallback, memo } from "react";
import Entity, { EntityClassNames } from "../Entity";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getWidgetIcon } from "../ExplorerIcons";
import WidgetContextMenu from "./WidgetContextMenu";
import { updateWidgetName } from "actions/propertyPaneActions";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { getSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { useNavigateToWidget } from "./useNavigateToWidget";

export type WidgetTree = WidgetProps & { children?: WidgetTree[] };

const UNREGISTERED_WIDGETS: WidgetType[] = ["ICON_WIDGET"];

const useWidget = (
  widgetId: string,
  widgetType: WidgetType,
  pageId: string,
  widgetsInStep: string[],
  parentModalId?: string,
) => {
  const selectedWidgets = useSelector(getSelectedWidgets);
  const lastSelectedWidget = useSelector(getSelectedWidget);
  const isWidgetSelected = selectedWidgets.includes(widgetId);
  const multipleWidgetsSelected = selectedWidgets.length > 1;

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
  const widgetsToExpand = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgetAncestry,
  );

  const shouldExpand = widgetsToExpand.includes(props.widgetId);

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

  const showContextMenu = !multipleWidgetsSelected;
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
      name={props.widgetName}
      searchKeyword={props.searchKeyword}
      step={props.step}
      updateEntityName={updateWidgetName}
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
    </Entity>
  );
});

WidgetEntity.displayName = "WidgetEntity";

export default WidgetEntity;
