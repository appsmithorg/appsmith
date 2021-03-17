import { FetchPageResponse } from "api/PageApi";
import { CANVAS_DEFAULT_HEIGHT_PX } from "constants/AppConstants";
import { XYCoord } from "react-dnd";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  WidgetOperation,
  WidgetOperations,
  WidgetProps,
} from "widgets/BaseWidget";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  RenderMode,
  WidgetType,
  WidgetTypes,
} from "constants/WidgetConstants";
import { snapToGrid } from "./helpers";
import { OccupiedSpace } from "constants/editorConstants";
import defaultTemplate from "templates/default";
import { generateReactKey } from "./generators";
import { ChartDataPoint } from "widgets/ChartWidget";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { isString } from "lodash";
import log from "loglevel";
import {
  migrateTablePrimaryColumnsBindings,
  tableWidgetPropertyPaneMigrations,
} from "utils/migrations/TableWidget";
import { migrateIncorrectDynamicBindingPathLists } from "utils/migrations/IncorrectDynamicBindingPathLists";
import * as Sentry from "@sentry/react";
import { nextAvailableRowInContainer } from "entities/Widget/utils";

export type WidgetOperationParams = {
  operation: WidgetOperation;
  widgetId: string;
  payload: any;
};

const { DEFAULT_GRID_ROW_HEIGHT } = GridDefaults;
type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

const defaultDSL = defaultTemplate;

const updateContainers = (dsl: ContainerWidgetProps<WidgetProps>) => {
  if (
    dsl.type === WidgetTypes.CONTAINER_WIDGET ||
    dsl.type === WidgetTypes.FORM_WIDGET
  ) {
    if (
      !(
        dsl.children &&
        dsl.children.length > 0 &&
        (dsl.children[0].type === WidgetTypes.CANVAS_WIDGET ||
          dsl.children[0].type === WidgetTypes.FORM_WIDGET)
      )
    ) {
      const canvas = {
        ...dsl,
        backgroundColor: "transparent",
        type: WidgetTypes.CANVAS_WIDGET,
        detachFromLayout: true,
        topRow: 0,
        leftColumn: 0,
        rightColumn: dsl.parentColumnSpace * (dsl.rightColumn - dsl.leftColumn),
        bottomRow: dsl.parentRowSpace * (dsl.bottomRow - dsl.topRow),
        widgetName: generateReactKey(),
        widgetId: generateReactKey(),
        parentRowSpace: 1,
        parentColumnSpace: 1,
        containerStyle: "none",
        canExtend: false,
        isVisible: true,
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete canvas.dynamicBindings;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete canvas.dynamicProperties;
      if (canvas.children && canvas.children.length > 0)
        canvas.children = canvas.children.map(updateContainers);
      dsl.children = [{ ...canvas }];
    }
  }
  return dsl;
};

//transform chart data, from old chart widget to new chart widget
//updatd chart widget has support for multiple series
const chartDataMigration = (currentDSL: ContainerWidgetProps<WidgetProps>) => {
  currentDSL.children = currentDSL.children?.map((children: WidgetProps) => {
    if (
      children.type === WidgetTypes.CHART_WIDGET &&
      children.chartData &&
      children.chartData.length &&
      !Array.isArray(children.chartData[0])
    ) {
      children.chartData = [{ data: children.chartData as ChartDataPoint[] }];
    } else if (
      children.type === WidgetTypes.CONTAINER_WIDGET ||
      children.type === WidgetTypes.FORM_WIDGET ||
      children.type === WidgetTypes.CANVAS_WIDGET ||
      children.type === WidgetTypes.TABS_WIDGET
    ) {
      children = chartDataMigration(children);
    }
    return children;
  });
  return currentDSL;
};

const singleChartDataMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child) => {
    if (child.type === WidgetTypes.CHART_WIDGET) {
      // Check if chart widget has the deprecated singleChartData property
      if (child.hasOwnProperty("singleChartData")) {
        // This is to make sure that the format of the chartData is accurate
        if (
          Array.isArray(child.singleChartData) &&
          !child.singleChartData[0].hasOwnProperty("seriesName")
        ) {
          child.singleChartData = {
            seriesName: "Series 1",
            data: child.singleChartData || [],
          };
        }
        //TODO: other possibilities?
        child.chartData = JSON.stringify([...child.singleChartData]);
        delete child.singleChartData;
      }
    }
    if (child.children && child.children.length > 0) {
      child = singleChartDataMigration(child);
    }
    return child;
  });

  return currentDSL;
};

const mapDataMigration = (currentDSL: ContainerWidgetProps<WidgetProps>) => {
  currentDSL.children = currentDSL.children?.map((children: WidgetProps) => {
    if (children.type === WidgetTypes.MAP_WIDGET) {
      if (children.markers) {
        children.markers = children.markers.map(
          (marker: { lat: any; lng: any; long: any; title: any }) => {
            return {
              lat: marker.lat,
              long: marker.lng || marker.long,
              title: marker.title,
            };
          },
        );
      }
      if (children.defaultMarkers) {
        const defaultMarkers = JSON.parse(children.defaultMarkers);
        children.defaultMarkers = defaultMarkers.map(
          (marker: {
            lat: number;
            lng: number;
            long: number;
            title: string;
          }) => {
            return {
              lat: marker.lat,
              long: marker.lng || marker.long,
              title: marker.title,
            };
          },
        );
      }
      if (children.selectedMarker) {
        children.selectedMarker = {
          lat: children.selectedMarker.lat,
          long: children.selectedMarker.lng || children.selectedMarker.long,
          title: children.selectedMarker.title,
        };
      }
      if (children.mapCenter) {
        children.mapCenter = {
          lat: children.mapCenter.lat,
          long: children.mapCenter.lng || children.mapCenter.long,
          title: children.mapCenter.title,
        };
      }
      if (children.center) {
        children.center = {
          lat: children.center.lat,
          long: children.center.lng || children.center.long,
          title: children.center.title,
        };
      }
    } else if (children.children && children.children.length > 0) {
      children = mapDataMigration(children);
    }
    return children;
  });
  return currentDSL;
};

const tabsWidgetTabsPropertyMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children
    ?.filter(Boolean)
    .map((child: WidgetProps) => {
      if (child.type === WidgetTypes.TABS_WIDGET) {
        try {
          const tabs = isString(child.tabs)
            ? JSON.parse(child.tabs)
            : child.tabs;
          const newTabs = tabs.map((tab: any) => {
            const childForTab = child.children
              ?.filter(Boolean)
              .find((tabChild: WidgetProps) => tabChild.tabId === tab.id);
            if (childForTab) {
              tab.widgetId = childForTab.widgetId;
            }
            return tab;
          });
          child.tabs = JSON.stringify(newTabs);
        } catch (migrationError) {
          log.debug({ migrationError });
        }
      }
      if (child.children && child.children.length) {
        child = tabsWidgetTabsPropertyMigration(child);
      }
      return child;
    });
  return currentDSL;
};

const dynamicPathListMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(dynamicPathListMigration);
  }
  if (currentDSL.dynamicBindings) {
    currentDSL.dynamicBindingPathList = Object.keys(
      currentDSL.dynamicBindings,
    ).map((path) => ({ key: path }));
    delete currentDSL.dynamicBindings;
  }
  if (currentDSL.dynamicTriggers) {
    currentDSL.dynamicTriggerPathList = Object.keys(
      currentDSL.dynamicTriggers,
    ).map((path) => ({ key: path }));
    delete currentDSL.dynamicTriggers;
  }
  if (currentDSL.dynamicProperties) {
    currentDSL.dynamicPropertyPathList = Object.keys(
      currentDSL.dynamicProperties,
    ).map((path) => ({ key: path }));
    delete currentDSL.dynamicProperties;
  }
  return currentDSL;
};

const addVersionNumberMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(addVersionNumberMigration);
  }
  if (currentDSL.version === undefined) {
    currentDSL.version = 1;
  }
  return currentDSL;
};

const canvasNameConflictMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
  props = { counter: 1 },
): ContainerWidgetProps<WidgetProps> => {
  if (
    currentDSL.type === WidgetTypes.CANVAS_WIDGET &&
    currentDSL.widgetName.startsWith("Canvas")
  ) {
    currentDSL.widgetName = `Canvas${props.counter}`;
    // Canvases inside tabs have `name` property as well
    if (currentDSL.name) {
      currentDSL.name = currentDSL.widgetName;
    }
    props.counter++;
  }
  currentDSL.children?.forEach((c) => canvasNameConflictMigration(c, props));

  return currentDSL;
};

const renamedCanvasNameConflictMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
  props = { counter: 1 },
): ContainerWidgetProps<WidgetProps> => {
  // Rename all canvas widgets except for MainContainer
  if (
    currentDSL.type === WidgetTypes.CANVAS_WIDGET &&
    currentDSL.widgetName !== "MainContainer"
  ) {
    currentDSL.widgetName = `Canvas${props.counter}`;
    // Canvases inside tabs have `name` property as well
    if (currentDSL.name) {
      currentDSL.name = currentDSL.widgetName;
    }
    props.counter++;
  }
  currentDSL.children?.forEach((c) => canvasNameConflictMigration(c, props));

  return currentDSL;
};

const rteDefaultValueMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
): ContainerWidgetProps<WidgetProps> => {
  if (currentDSL.type === WidgetTypes.RICH_TEXT_EDITOR_WIDGET) {
    currentDSL.inputType = "html";
  }
  currentDSL.children?.forEach((children) =>
    rteDefaultValueMigration(children),
  );

  return currentDSL;
};

// A rudimentary transform function which updates the DSL based on its version.
function migrateOldChartData(currentDSL: ContainerWidgetProps<WidgetProps>) {
  if (currentDSL.type === WidgetTypes.CHART_WIDGET) {
    if (isString(currentDSL.chartData)) {
      try {
        currentDSL.chartData = JSON.parse(currentDSL.chartData);
      } catch (error) {
        Sentry.captureException({
          message: "Chart Migration Failed",
          oldData: currentDSL.chartData,
        });
        currentDSL.chartData = [];
      }
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(migrateOldChartData);
  }
  return currentDSL;
}

export const calculateDynamicHeight = (
  canvasWidgets: {
    [widgetId: string]: FlattenedWidgetProps;
  } = {},
  presentMinimumHeight = CANVAS_DEFAULT_HEIGHT_PX,
) => {
  let minmumHeight = presentMinimumHeight;
  const nextAvailableRow = nextAvailableRowInContainer(
    MAIN_CONTAINER_WIDGET_ID,
    canvasWidgets,
  );
  const screenHeight = window.innerHeight;
  const gridRowHeight = GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  const calculatedCanvasHeight = nextAvailableRow * gridRowHeight;
  // DGRH - DEFAULT_GRID_ROW_HEIGHT
  // View Mode: Header height + Page Selection Tab = 2 * DGRH (approx)
  // Edit Mode: Header height + Canvas control = 2 * DGRH (approx)
  // buffer = DGRH, it's not 2 * DGRH coz we already add a buffer on the canvas which is also equal to DGRH.
  const buffer = gridRowHeight;
  const calculatedMinHeight =
    Math.floor((screenHeight - buffer) / gridRowHeight) * gridRowHeight;
  if (
    calculatedCanvasHeight < screenHeight &&
    calculatedMinHeight !== presentMinimumHeight
  ) {
    minmumHeight = calculatedMinHeight;
  }
  return minmumHeight;
};

// A rudimentary transform function which updates the DSL based on its version.
// A more modular approach needs to be designed.
const transformDSL = (currentDSL: ContainerWidgetProps<WidgetProps>) => {
  if (currentDSL.version === undefined) {
    // Since this top level widget is a CANVAS_WIDGET,
    // DropTargetComponent needs to know the minimum height the canvas can take
    // See DropTargetUtils.ts
    currentDSL.minHeight = calculateDynamicHeight();

    // For the first time the DSL is created, remove one row from the total possible rows
    // to adjust for padding and margins.
    currentDSL.snapRows =
      Math.floor(currentDSL.bottomRow / DEFAULT_GRID_ROW_HEIGHT) - 1;

    // Force the width of the canvas to 1224 px
    currentDSL.rightColumn = 1224;
    // The canvas is a CANVAS_WIDGET whichdoesn't have a background or borders by default
    currentDSL.backgroundColor = "none";
    currentDSL.containerStyle = "none";
    currentDSL.type = WidgetTypes.CANVAS_WIDGET;
    currentDSL.detachFromLayout = true;
    currentDSL.canExtend = true;

    // Update version to make sure this doesn't run everytime.
    currentDSL.version = 1;
  }

  if (currentDSL.version === 1) {
    if (currentDSL.children && currentDSL.children.length > 0)
      currentDSL.children = currentDSL.children.map(updateContainers);
    currentDSL.version = 2;
  }
  if (currentDSL.version === 2) {
    currentDSL = chartDataMigration(currentDSL);
    currentDSL.version = 3;
  }
  if (currentDSL.version === 3) {
    currentDSL = mapDataMigration(currentDSL);
    currentDSL.version = 4;
  }
  if (currentDSL.version === 4) {
    currentDSL = singleChartDataMigration(currentDSL);
    currentDSL.version = 5;
  }
  if (currentDSL.version === 5) {
    currentDSL = tabsWidgetTabsPropertyMigration(currentDSL);
    currentDSL.version = 6;
  }
  if (currentDSL.version === 6) {
    currentDSL = dynamicPathListMigration(currentDSL);
    currentDSL.version = 7;
  }

  if (currentDSL.version === 7) {
    currentDSL = canvasNameConflictMigration(currentDSL);
    currentDSL.version = 8;
  }

  if (currentDSL.version === 8) {
    currentDSL = renamedCanvasNameConflictMigration(currentDSL);
    currentDSL.version = 9;
  }

  if (currentDSL.version === 9) {
    currentDSL = tableWidgetPropertyPaneMigrations(currentDSL);
    currentDSL.version = 10;
  }

  if (currentDSL.version === 10) {
    currentDSL = addVersionNumberMigration(currentDSL);
    currentDSL.version = 11;
  }

  if (currentDSL.version === 11) {
    currentDSL = migrateTablePrimaryColumnsBindings(currentDSL);
    currentDSL.version = 12;
  }

  if (currentDSL.version === 12) {
    currentDSL = migrateIncorrectDynamicBindingPathLists(currentDSL);
    currentDSL.version = 13;
  }

  if (currentDSL.version === 13) {
    currentDSL = migrateOldChartData(currentDSL);
    currentDSL.version = 14;
  }

  if (currentDSL.version === 14) {
    currentDSL = rteDefaultValueMigration(currentDSL);
    currentDSL.version = 15;
  }

  return currentDSL;
};

export const extractCurrentDSL = (
  fetchPageResponse?: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  const currentDSL = fetchPageResponse?.data.layouts[0].dsl || defaultDSL;
  return transformDSL(currentDSL);
};

export const getDropZoneOffsets = (
  colWidth: number,
  rowHeight: number,
  dragOffset: XYCoord,
  parentOffset: XYCoord,
) => {
  // Calculate actual drop position by snapping based on x, y and grid cell size
  return snapToGrid(
    colWidth,
    rowHeight,
    dragOffset.x - parentOffset.x,
    dragOffset.y - parentOffset.y,
  );
};

const areIntersecting = (r1: Rect, r2: Rect) => {
  return !(
    r2.left >= r1.right ||
    r2.right <= r1.left ||
    r2.top >= r1.bottom ||
    r2.bottom <= r1.top
  );
};

export const isDropZoneOccupied = (
  offset: Rect,
  widgetId: string,
  occupied?: OccupiedSpace[],
) => {
  if (occupied) {
    occupied = occupied.filter((widgetDetails) => {
      return (
        widgetDetails.id !== widgetId && widgetDetails.parentId !== widgetId
      );
    });
    for (let i = 0; i < occupied.length; i++) {
      if (areIntersecting(occupied[i], offset)) {
        return true;
      }
    }
    return false;
  }
  return false;
};

export const isWidgetOverflowingParentBounds = (
  parentRowCols: { rows?: number; cols?: number },
  offset: Rect,
): boolean => {
  return (
    offset.right < 0 ||
    offset.top < 0 ||
    (parentRowCols.cols || GridDefaults.DEFAULT_GRID_COLUMNS) < offset.right ||
    (parentRowCols.rows || 0) < offset.bottom
  );
};

export const noCollision = (
  clientOffset: XYCoord,
  colWidth: number,
  rowHeight: number,
  widget: WidgetProps & Partial<WidgetConfigProps>,
  dropTargetOffset: XYCoord,
  occupiedSpaces?: OccupiedSpace[],
  rows?: number,
  cols?: number,
): boolean => {
  if (clientOffset && dropTargetOffset && widget) {
    if (widget.detachFromLayout) {
      return true;
    }
    const [left, top] = getDropZoneOffsets(
      colWidth,
      rowHeight,
      clientOffset as XYCoord,
      dropTargetOffset,
    );
    if (left < 0 || top < 0) {
      return false;
    }
    const widgetWidth = widget.columns
      ? widget.columns
      : widget.rightColumn - widget.leftColumn;
    const widgetHeight = widget.rows
      ? widget.rows
      : widget.bottomRow - widget.topRow;
    const currentOffset = {
      left,
      right: left + widgetWidth,
      top,
      bottom: top + widgetHeight,
    };
    return (
      !isDropZoneOccupied(currentOffset, widget.widgetId, occupiedSpaces) &&
      !isWidgetOverflowingParentBounds({ rows, cols }, currentOffset)
    );
  }
  return false;
};

export const currentDropRow = (
  dropTargetRowSpace: number,
  dropTargetVerticalOffset: number,
  draggableItemVerticalOffset: number,
  widget: WidgetProps & Partial<WidgetConfigProps>,
) => {
  const widgetHeight = widget.rows
    ? widget.rows
    : widget.bottomRow - widget.topRow;
  const top = Math.round(
    (draggableItemVerticalOffset - dropTargetVerticalOffset) /
      dropTargetRowSpace,
  );
  const currentBottomOffset = top + widgetHeight;
  return currentBottomOffset;
};

export const widgetOperationParams = (
  widget: WidgetProps & Partial<WidgetConfigProps>,
  widgetOffset: XYCoord,
  parentOffset: XYCoord,
  parentColumnSpace: number,
  parentRowSpace: number,
  parentWidgetId: string, // parentWidget
): WidgetOperationParams => {
  const [leftColumn, topRow] = getDropZoneOffsets(
    parentColumnSpace,
    parentRowSpace,
    widgetOffset,
    parentOffset,
  );
  // If this is an existing widget, we'll have the widgetId
  // Therefore, this is a move operation on drop of the widget
  if (widget.widgetName) {
    return {
      operation: WidgetOperations.MOVE,
      widgetId: widget.widgetId,
      payload: {
        leftColumn,
        topRow,
        parentId: widget.parentId,
        newParentId: parentWidgetId,
      },
    };
    // If this is not an existing widget, we'll not have the widgetId
    // Therefore, this is an operation to add child to this container
  }
  const widgetDimensions = {
    columns: widget.columns,
    rows: widget.rows,
  };
  return {
    operation: WidgetOperations.ADD_CHILD,
    widgetId: parentWidgetId,
    payload: {
      type: widget.type,
      leftColumn,
      topRow,
      ...widgetDimensions,
      parentRowSpace,
      parentColumnSpace,
      newWidgetId: widget.widgetId,
    },
  };
};

export const updateWidgetPosition = (
  widget: WidgetProps,
  leftColumn: number,
  topRow: number,
) => {
  const newPositions = {
    leftColumn,
    topRow,
    rightColumn: leftColumn + (widget.rightColumn - widget.leftColumn),
    bottomRow: topRow + (widget.bottomRow - widget.topRow),
  };

  return {
    ...newPositions,
  };
};

export const getCanvasSnapRows = (
  bottomRow: number,
  canExtend: boolean,
): number => {
  const totalRows = Math.floor(
    bottomRow / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );

  // Canvas Widgets do not need to accomodate for widget and container padding.
  // Only when they're extensible
  if (canExtend) {
    return totalRows;
  }
  // When Canvas widgets are not extensible
  return totalRows - 1;
};

export const getSnapColumns = (): number => {
  return GridDefaults.DEFAULT_GRID_COLUMNS;
};

export const generateWidgetProps = (
  parent: FlattenedWidgetProps,
  type: WidgetType,
  leftColumn: number,
  topRow: number,
  parentRowSpace: number,
  parentColumnSpace: number,
  widgetName: string,
  widgetConfig: {
    widgetId: string;
    renderMode: RenderMode;
  } & Partial<WidgetProps>,
  version: number,
): ContainerWidgetProps<WidgetProps> => {
  if (parent) {
    const sizes = {
      leftColumn,
      rightColumn: leftColumn + widgetConfig.columns,
      topRow,
      bottomRow: topRow + widgetConfig.rows,
    };

    const others = {};
    const props: ContainerWidgetProps<WidgetProps> = {
      isVisible: WidgetTypes.MODAL_WIDGET === type ? undefined : true,
      ...widgetConfig,
      type,
      widgetName,
      isLoading: false,
      parentColumnSpace,
      parentRowSpace,
      ...sizes,
      ...others,
      parentId: parent.widgetId,
      version,
    };
    delete props.rows;
    delete props.columns;
    return props;
  } else {
    if (parent) {
      throw Error("Failed to create widget: Parent's size cannot be calculate");
    } else throw Error("Failed to create widget: Parent was not provided ");
  }
};
