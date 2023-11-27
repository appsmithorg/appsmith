import type { WidgetProps } from "widgets/BaseWidget";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { generateReactKey } from "utils/generators";
import type { RenderModes } from "constants/WidgetConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { zonePreset } from "layoutSystems/anvil/layoutComponents/presets/zonePreset";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { isLargeWidget } from "../widgetUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { select } from "redux-saga/effects";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getNextWidgetName } from "sagas/WidgetOperationUtils";
import { getRenderMode } from "selectors/editorSelectors";
import { addWidgetsToChildTemplate } from "./additionUtils";

export function* createZoneAndAddWidgets(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  parentId: string,
  additionalWidgets: CanvasWidgetsReduxState = {},
) {
  const evalTree: DataTree = yield select(getDataTree);
  const renderMode: RenderModes = yield select(getRenderMode);
  /**
   * Step 1: Create Zone widget.
   */
  const zoneProps: WidgetProps = {
    borderRadius: "0.375rem",
    bottomRow: 10,
    children: [],
    isLoading: false,
    isVisible: true,
    leftColumn: 0,
    parentColumnSpace: 1,
    parentId,
    parentRowSpace: 10,
    renderMode,
    responsiveBehavior: ResponsiveBehavior.Fill,
    rightColumn: 64,
    topRow: 0,
    type: "ZONE_WIDGET",
    version: 1,
    widgetId: generateReactKey(),
    widgetName: getNextWidgetName(
      { ...allWidgets, ...additionalWidgets },
      "ZONE_WIDGET",
      evalTree,
    ),
  };

  /**
   * Step 2: Create Canvas widget and add to Zone.
   */
  const preset: LayoutProps[] = zonePreset();
  let zoneLayout: LayoutProps = preset[0];
  const canvasProps: WidgetProps = {
    bottomRow: 10,
    children: [],
    isLoading: false,
    layout: preset,
    leftColumn: 0,
    parentId: zoneProps.widgetId,
    parentColumnSpace: 1,
    parentRowSpace: 10,
    renderMode,
    responsiveBehavior: ResponsiveBehavior.Fill,
    rightColumn: 64,
    topRow: 0,
    type: "CANVAS_WIDGET",
    version: 1,
    widgetId: generateReactKey(),
    widgetName: getNextWidgetName(
      { ...allWidgets, ...additionalWidgets },
      "CANVAS_WIDGET",
      evalTree,
    ),
  };

  /**
   * Step 3: Split new widgets based on type.
   * This is needed because small and large widgets can't coexist in the same row.
   * So we need to create separate rows for each large widget.
   */
  const [smallWidgets, largeWidgets] = splitWidgets(draggedWidgets);

  /**
   * Step 4: Add small widgets to the zone layout.
   */
  const zoneComp: typeof BaseLayoutComponent = LayoutFactory.get(
    zoneLayout.layoutType,
  );

  if (smallWidgets.length) {
    zoneLayout = addWidgetsToChildTemplate(
      zoneLayout,
      zoneComp,
      smallWidgets,
      highlight,
    );
  }

  /**
   * Step 5: Add large widgets to the zone layout.
   */
  largeWidgets.forEach((widget: WidgetLayoutProps) => {
    zoneLayout = addWidgetsToChildTemplate(
      zoneLayout,
      zoneComp,
      [widget],
      highlight,
    );
  });

  /**
   * Step 6: Update zone preset with the updated zone layout.
   */
  preset[0] = zoneLayout;

  /**
   * Step 7: Update canvas widget with the updated preset.
   */
  canvasProps.layout = preset;

  /**
   * Step 8: Add new widgetIds to children of canvas widget.
   */
  canvasProps.children = draggedWidgets.map(
    (widget: WidgetLayoutProps) => widget.widgetId,
  );

  /**
   * Step 9: Establish relationship between zone and canvas widgets.
   */
  zoneProps.children = [canvasProps.widgetId];
  canvasProps.parentId = zoneProps.widgetId;

  /**
   * Step 10: Revert the relationships that were originally established while creating the dragged widgets.
   */
  draggedWidgets.forEach((widget: WidgetLayoutProps) => {
    allWidgets[widget.widgetId] = {
      ...allWidgets[widget.widgetId],
      parentId: canvasProps.widgetId,
    };
  });

  return {
    canvasWidgets: {
      ...allWidgets,
      [canvasProps.widgetId]: canvasProps,
      [zoneProps.widgetId]: zoneProps,
    },
    zone: zoneProps,
  };
}

function splitWidgets(widgets: WidgetLayoutProps[]): WidgetLayoutProps[][] {
  const smallWidgets: WidgetLayoutProps[] = [];
  const largeWidgets: WidgetLayoutProps[] = [];
  widgets.forEach((widget: WidgetLayoutProps) => {
    if (isLargeWidget(widget.widgetType)) largeWidgets.push(widget);
    else smallWidgets.push(widget);
  });
  return [smallWidgets, largeWidgets];
}
