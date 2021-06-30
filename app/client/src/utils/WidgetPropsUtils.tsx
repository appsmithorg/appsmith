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
  LATEST_PAGE_VERSION,
  MAIN_CONTAINER_WIDGET_ID,
  RenderMode,
  WidgetType,
  WidgetTypes,
} from "constants/WidgetConstants";
import { renameKeyInObject, snapToGrid } from "./helpers";
import { OccupiedSpace } from "constants/editorConstants";
import defaultTemplate from "templates/default";
import { generateReactKey } from "./generators";
import { ChartDataPoint } from "widgets/ChartWidget";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { get, has, isString, omit, set } from "lodash";
import log from "loglevel";
import {
  migrateTablePrimaryColumnsBindings,
  tableWidgetPropertyPaneMigrations,
  migrateTableWidgetParentRowSpaceProperty,
  migrateTableWidgetHeaderVisibilityProperties,
} from "utils/migrations/TableWidget";
import { migrateIncorrectDynamicBindingPathLists } from "utils/migrations/IncorrectDynamicBindingPathLists";
import * as Sentry from "@sentry/react";
import { migrateTextStyleFromTextWidget } from "./migrations/TextWidgetReplaceTextStyle";
import { nextAvailableRowInContainer } from "entities/Widget/utils";
import { DATA_BIND_REGEX_GLOBAL } from "constants/BindingsConstants";
import WidgetConfigResponse, {
  GRID_DENSITY_MIGRATION_V1,
} from "mockResponses/WidgetConfigResponse";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { theme } from "../../src/constants/DefaultTheme";

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

function migrateTabsDataUsingMigrator(
  currentDSL: ContainerWidgetProps<WidgetProps>,
) {
  if (currentDSL.type === WidgetTypes.TABS_WIDGET && currentDSL.version === 1) {
    try {
      currentDSL.type = WidgetTypes.TABS_MIGRATOR_WIDGET;
      currentDSL.version = 1;
    } catch (error) {
      Sentry.captureException({
        message: "Tabs Migration Failed",
        oldData: currentDSL.tabs,
      });
      currentDSL.tabsObj = {};
      delete currentDSL.tabs;
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(migrateTabsDataUsingMigrator);
  }
  return currentDSL;
}

export function migrateTabsData(currentDSL: ContainerWidgetProps<WidgetProps>) {
  if (
    [WidgetTypes.TABS_WIDGET, WidgetTypes.TABS_MIGRATOR_WIDGET].includes(
      currentDSL.type as any,
    ) &&
    currentDSL.version === 1
  ) {
    try {
      currentDSL.type = WidgetTypes.TABS_WIDGET;
      const isTabsDataBinded = isString(currentDSL.tabs);
      currentDSL.dynamicPropertyPathList =
        currentDSL.dynamicPropertyPathList || [];
      currentDSL.dynamicBindingPathList =
        currentDSL.dynamicBindingPathList || [];

      if (isTabsDataBinded) {
        const tabsString = currentDSL.tabs.replace(
          DATA_BIND_REGEX_GLOBAL,
          (word: any) => `"${word}"`,
        );
        try {
          currentDSL.tabs = JSON.parse(tabsString);
        } catch (error) {
          return migrateTabsDataUsingMigrator(currentDSL);
        }
        const dynamicPropsList = currentDSL.tabs
          .filter((each: any) => DATA_BIND_REGEX_GLOBAL.test(each.isVisible))
          .map((each: any) => {
            return { key: `tabsObj.${each.id}.isVisible` };
          });
        const dynamicBindablePropsList = currentDSL.tabs.map((each: any) => {
          return { key: `tabsObj.${each.id}.isVisible` };
        });
        currentDSL.dynamicPropertyPathList = [
          ...currentDSL.dynamicPropertyPathList,
          ...dynamicPropsList,
        ];
        currentDSL.dynamicBindingPathList = [
          ...currentDSL.dynamicBindingPathList,
          ...dynamicBindablePropsList,
        ];
      }
      currentDSL.dynamicPropertyPathList = currentDSL.dynamicPropertyPathList.filter(
        (each) => {
          return each.key !== "tabs";
        },
      );
      currentDSL.dynamicBindingPathList = currentDSL.dynamicBindingPathList.filter(
        (each) => {
          return each.key !== "tabs";
        },
      );
      currentDSL.tabsObj = currentDSL.tabs.reduce(
        (obj: any, tab: any, index: number) => {
          obj = {
            ...obj,
            [tab.id]: {
              ...tab,
              isVisible: tab.isVisible === undefined ? true : tab.isVisible,
              index,
            },
          };
          return obj;
        },
        {},
      );
      currentDSL.version = 2;
      delete currentDSL.tabs;
    } catch (error) {
      Sentry.captureException({
        message: "Tabs Migration Failed",
        oldData: currentDSL.tabs,
      });
      currentDSL.tabsObj = {};
      delete currentDSL.tabs;
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(migrateTabsData);
  }
  return currentDSL;
}

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

/**
 * changes chartData which we were using as array. now it will be a object
 *
 *
 * @param currentDSL
 * @returns
 */
export function migrateChartDataFromArrayToObject(
  currentDSL: ContainerWidgetProps<WidgetProps>,
) {
  currentDSL.children = currentDSL.children?.map((children: WidgetProps) => {
    if (children.type === WidgetTypes.CHART_WIDGET) {
      if (Array.isArray(children.chartData)) {
        const newChartData = {};
        const dynamicBindingPathList = children?.dynamicBindingPathList
          ? children?.dynamicBindingPathList.slice()
          : [];

        children.chartData.map((datum: any, index: number) => {
          const generatedKey = generateReactKey();
          set(newChartData, `${generatedKey}`, datum);

          if (
            Array.isArray(children.dynamicBindingPathList) &&
            children.dynamicBindingPathList?.findIndex(
              (path) => (path.key = `chartData[${index}].data`),
            ) > -1
          ) {
            const foundIndex = children.dynamicBindingPathList.findIndex(
              (path) => (path.key = `chartData[${index}].data`),
            );

            dynamicBindingPathList[foundIndex] = {
              key: `chartData.${generatedKey}.data`,
            };
          }
        });

        children.dynamicBindingPathList = dynamicBindingPathList;
        children.chartData = newChartData;
      }
    } else if (
      children.type === WidgetTypes.CONTAINER_WIDGET ||
      children.type === WidgetTypes.FORM_WIDGET ||
      children.type === WidgetTypes.CANVAS_WIDGET ||
      children.type === WidgetTypes.TABS_WIDGET
    ) {
      children = migrateChartDataFromArrayToObject(children);
    }

    return children;
  });

  return currentDSL;
}

const pixelToNumber = (pixel: string) => {
  if (pixel.includes("px")) {
    return parseInt(pixel.split("px").join(""));
  }
  return 0;
};

export const calculateDynamicHeight = (
  canvasWidgets: {
    [widgetId: string]: FlattenedWidgetProps;
  } = {},
  presentMinimumHeight = CANVAS_DEFAULT_HEIGHT_PX,
) => {
  let minimumHeight = presentMinimumHeight;
  const nextAvailableRow = nextAvailableRowInContainer(
    MAIN_CONTAINER_WIDGET_ID,
    canvasWidgets,
  );
  const screenHeight = window.innerHeight;
  const gridRowHeight = GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  const calculatedCanvasHeight = nextAvailableRow * gridRowHeight;
  // DGRH - DEFAULT_GRID_ROW_HEIGHT
  // View Mode: Header height + Page Selection Tab = 8 * DGRH (approx)
  // Edit Mode: Header height + Canvas control = 8 * DGRH (approx)
  // buffer: ~8 grid row height
  const buffer = gridRowHeight + 2 * pixelToNumber(theme.smallHeaderHeight);
  const calculatedMinHeight =
    Math.floor((screenHeight - buffer) / gridRowHeight) * gridRowHeight;
  if (
    calculatedCanvasHeight < screenHeight &&
    calculatedMinHeight !== presentMinimumHeight
  ) {
    minimumHeight = calculatedMinHeight;
  }
  return minimumHeight;
};

export const migrateInitialValues = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === WidgetTypes.INPUT_WIDGET) {
      child = {
        isRequired: false,
        isDisabled: false,
        resetOnSubmit: false,
        ...child,
      };
    } else if (child.type === WidgetTypes.DROP_DOWN_WIDGET) {
      child = {
        isRequired: false,
        isDisabled: false,
        ...child,
      };
    } else if (child.type === WidgetTypes.DATE_PICKER_WIDGET2) {
      child = {
        minDate: "2001-01-01 00:00",
        maxDate: "2041-12-31 23:59",
        isRequired: false,
        ...child,
      };
    } else if (child.type === WidgetTypes.SWITCH_WIDGET) {
      child = {
        isDisabled: false,
        ...child,
      };
    } else if (child.type === WidgetTypes.ICON_WIDGET) {
      child = {
        isRequired: false,
        ...child,
      };
    } else if (child.type === WidgetTypes.VIDEO_WIDGET) {
      child = {
        isRequired: false,
        isDisabled: false,
        ...child,
      };
    } else if (child.type === WidgetTypes.CHECKBOX_WIDGET) {
      child = {
        isDisabled: false,
        isRequired: false,
        ...child,
      };
    } else if (child.type === WidgetTypes.RADIO_GROUP_WIDGET) {
      child = {
        isDisabled: false,
        isRequired: false,
        ...child,
      };
    } else if (child.type === WidgetTypes.FILE_PICKER_WIDGET) {
      child = {
        isDisabled: false,
        isRequired: false,
        allowedFileTypes: [],
        ...child,
      };
    } else if (child.children && child.children.length > 0) {
      child = migrateInitialValues(child);
    }
    return child;
  });
  return currentDSL;
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

  if (currentDSL.version === 15) {
    currentDSL = migrateTextStyleFromTextWidget(currentDSL);
    currentDSL.version = 16;
  }

  if (currentDSL.version === 16) {
    currentDSL = migrateChartDataFromArrayToObject(currentDSL);
    currentDSL.version = 17;
  }

  if (currentDSL.version === 17) {
    currentDSL = migrateTabsData(currentDSL);
    currentDSL.version = 18;
  }

  if (currentDSL.version === 18) {
    currentDSL = migrateInitialValues(currentDSL);
    currentDSL.version = 19;
  }

  if (currentDSL.version === 19) {
    currentDSL.snapColumns = GridDefaults.DEFAULT_GRID_COLUMNS;
    currentDSL.snapRows = getCanvasSnapRows(
      currentDSL.bottomRow,
      currentDSL.detachFromLayout || false,
    );
    currentDSL = migrateToNewLayout(currentDSL);
    currentDSL.version = 20;
  }

  if (currentDSL.version === 20) {
    currentDSL = migrateNewlyAddedTabsWidgetsMissingData(currentDSL);
    currentDSL.version = 21;
  }

  if (currentDSL.version === 21) {
    const {
      entities: { canvasWidgets },
    } = CanvasWidgetsNormalizer.normalize(currentDSL);
    currentDSL = migrateWidgetsWithoutLeftRightColumns(
      currentDSL,
      canvasWidgets,
    );
    currentDSL = migrateOverFlowingTabsWidgets(currentDSL, canvasWidgets);
    currentDSL.version = 22;
  }

  if (currentDSL.version === 22) {
    currentDSL = migrateTableWidgetParentRowSpaceProperty(currentDSL);
    currentDSL.version = 23;
  }

  if (currentDSL.version === 23) {
    currentDSL = addLogBlackListToAllListWidgetChildren(currentDSL);
    currentDSL.version = 24;
  }

  if (currentDSL.version === 24) {
    currentDSL = migrateTableWidgetHeaderVisibilityProperties(currentDSL);
    currentDSL.version = 25;
  }

  if (currentDSL.version === 25) {
    currentDSL = migrateItemsToListDataInListWidget(currentDSL);
    currentDSL.version = 26;
  }
  if (currentDSL.version === 26) {
    currentDSL = migrateFilterValueForDropDownWidget(currentDSL);
    currentDSL.version = LATEST_PAGE_VERSION;
  }

  return currentDSL;
};

const addFilterDefaultValue = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === WidgetTypes.DROP_DOWN_WIDGET) {
    if (!currentDSL.hasOwnProperty("isFilterable")) {
      currentDSL.isFilterable = true;
    }
  }
  return currentDSL;
};
export const migrateFilterValueForDropDownWidget = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  const newDSL = addFilterDefaultValue(currentDSL);

  newDSL.children = newDSL.children?.map((children: WidgetProps) => {
    return migrateFilterValueForDropDownWidget(children);
  });

  return newDSL;
};
export const migrateObjectFitToImageWidget = (
  dsl: ContainerWidgetProps<WidgetProps>,
) => {
  const addObjectFitProperty = (widgetProps: WidgetProps) => {
    widgetProps.objectFit = "cover";
    if (widgetProps.children && widgetProps.children.length) {
      widgetProps.children.forEach((eachWidgetProp: WidgetProps) => {
        if (widgetProps.type === "IMAGE_WIDGET") {
          addObjectFitProperty(eachWidgetProp);
        }
      });
    }
  };
  addObjectFitProperty(dsl);
  return dsl;
};

const migrateOverFlowingTabsWidgets = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
  canvasWidgets: any,
) => {
  if (
    currentDSL.type === "TABS_WIDGET" &&
    currentDSL.version === 3 &&
    currentDSL.children &&
    currentDSL.children.length
  ) {
    const tabsWidgetHeight =
      (currentDSL.bottomRow - currentDSL.topRow) * currentDSL.parentRowSpace;
    const widgetHasOverflowingChildren = currentDSL.children.some((eachTab) => {
      if (eachTab.children && eachTab.children.length) {
        return eachTab.children.some((child: WidgetProps) => {
          if (canvasWidgets[child.widgetId].repositioned) {
            const tabHeight = child.bottomRow * child.parentRowSpace;
            return tabsWidgetHeight < tabHeight;
          }
          return false;
        });
      }
      return false;
    });
    if (widgetHasOverflowingChildren) {
      currentDSL.shouldScrollContents = true;
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((eachChild) =>
      migrateOverFlowingTabsWidgets(eachChild, canvasWidgets),
    );
  }
  return currentDSL;
};

const migrateWidgetsWithoutLeftRightColumns = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
  canvasWidgets: any,
) => {
  if (
    currentDSL.widgetId !== MAIN_CONTAINER_WIDGET_ID &&
    !(
      currentDSL.hasOwnProperty("leftColumn") &&
      currentDSL.hasOwnProperty("rightColumn")
    )
  ) {
    try {
      const nextRow = nextAvailableRowInContainer(
        currentDSL.parentId || MAIN_CONTAINER_WIDGET_ID,
        omit(canvasWidgets, [currentDSL.widgetId]),
      );
      canvasWidgets[currentDSL.widgetId].repositioned = true;
      const leftColumn = 0;
      const rightColumn = WidgetConfigResponse.config[currentDSL.type].rows;
      const bottomRow = nextRow + (currentDSL.bottomRow - currentDSL.topRow);
      const topRow = nextRow;
      currentDSL = {
        ...currentDSL,
        topRow,
        bottomRow,
        rightColumn,
        leftColumn,
      };
    } catch (error) {
      Sentry.captureException({
        message: "Migrating position of widget on data loss failed",
        oldData: currentDSL,
      });
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((dsl) =>
      migrateWidgetsWithoutLeftRightColumns(dsl, canvasWidgets),
    );
  }
  return currentDSL;
};

const migrateNewlyAddedTabsWidgetsMissingData = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === WidgetTypes.TABS_WIDGET && currentDSL.version === 2) {
    try {
      if (currentDSL.children && currentDSL.children.length) {
        currentDSL.children = currentDSL.children.map((each) => {
          if (has(currentDSL, ["leftColumn", "rightColumn", "bottomRow"])) {
            return each;
          }
          return {
            ...each,
            leftColumn: 0,
            rightColumn:
              (currentDSL.rightColumn - currentDSL.leftColumn) *
              currentDSL.parentColumnSpace,
            bottomRow:
              (currentDSL.bottomRow - currentDSL.topRow) *
              currentDSL.parentRowSpace,
          };
        });
      }
      currentDSL.version = 3;
    } catch (error) {
      Sentry.captureException({
        message: "Tabs Migration to add missing fields Failed",
        oldData: currentDSL.children,
      });
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map(
      migrateNewlyAddedTabsWidgetsMissingData,
    );
  }
  return currentDSL;
};

export const migrateToNewLayout = (dsl: ContainerWidgetProps<WidgetProps>) => {
  const scaleWidget = (widgetProps: WidgetProps) => {
    widgetProps.bottomRow *= GRID_DENSITY_MIGRATION_V1;
    widgetProps.topRow *= GRID_DENSITY_MIGRATION_V1;
    widgetProps.leftColumn *= GRID_DENSITY_MIGRATION_V1;
    widgetProps.rightColumn *= GRID_DENSITY_MIGRATION_V1;
    if (widgetProps.children && widgetProps.children.length) {
      widgetProps.children.forEach((eachWidgetProp: WidgetProps) => {
        scaleWidget(eachWidgetProp);
      });
    }
  };
  scaleWidget(dsl);
  return dsl;
};

export const checkIfMigrationIsNeeded = (
  fetchPageResponse?: FetchPageResponse,
) => {
  const currentDSL = fetchPageResponse?.data.layouts[0].dsl || defaultDSL;
  return currentDSL.version !== LATEST_PAGE_VERSION;
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

export const areIntersecting = (r1: Rect, r2: Rect) => {
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

/**
 * adds logBlackList key for all list widget children
 *
 * @param currentDSL
 * @returns
 */
const addLogBlackListToAllListWidgetChildren = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((children: WidgetProps) => {
    if (children.type === WidgetTypes.LIST_WIDGET) {
      const widgets = get(
        children,
        "children.0.children.0.children.0.children",
      );

      widgets.map((widget: any, index: number) => {
        const logBlackList: { [key: string]: boolean } = {};

        Object.keys(widget).map((key) => {
          logBlackList[key] = true;
        });
        if (!widget.logBlackList) {
          set(
            children,
            `children.0.children.0.children.0.children.${index}.logBlackList`,
            logBlackList,
          );
        }
      });
    }

    return children;
  });

  return currentDSL;
};

/**
 * changes items -> listData
 *
 * @param currentDSL
 * @returns
 */
const migrateItemsToListDataInListWidget = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === WidgetTypes.LIST_WIDGET) {
    currentDSL = renameKeyInObject(currentDSL, "items", "listData");

    currentDSL.dynamicBindingPathList = currentDSL.dynamicBindingPathList?.map(
      (path: { key: string }) => {
        if (path.key === "items") {
          return { key: "listData" };
        }

        return path;
      },
    );

    currentDSL.dynamicBindingPathList?.map((path: { key: string }) => {
      if (
        get(currentDSL, path.key) &&
        path.key !== "items" &&
        path.key !== "listData" &&
        isString(get(currentDSL, path.key))
      ) {
        set(
          currentDSL,
          path.key,
          get(currentDSL, path.key, "").replace("items", "listData"),
        );
      }
    });

    Object.keys(currentDSL.template).map((widgetName) => {
      const currentWidget = currentDSL.template[widgetName];

      currentWidget.dynamicBindingPathList?.map((path: { key: string }) => {
        set(
          currentWidget,
          path.key,
          get(currentWidget, path.key).replace("items", "listData"),
        );
      });
    });
  }

  if (currentDSL.children && currentDSL.children.length > 0) {
    currentDSL.children = currentDSL.children.map(
      migrateItemsToListDataInListWidget,
    );
  }
  return currentDSL;
};
