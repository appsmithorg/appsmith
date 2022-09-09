import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { generateReactKey } from "./generators";
import {
  GridDefaults,
  LATEST_PAGE_VERSION,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { nextAvailableRowInContainer } from "entities/Widget/utils";
import { get, has, isEmpty, isString, omit, set } from "lodash";
import * as Sentry from "@sentry/react";
import { ChartDataPoint } from "widgets/ChartWidget/constants";
import log from "loglevel";
import { migrateIncorrectDynamicBindingPathLists } from "./migrations/IncorrectDynamicBindingPathLists";
import {
  migrateTablePrimaryColumnsBindings,
  migrateTableWidgetHeaderVisibilityProperties,
  migrateTableWidgetParentRowSpaceProperty,
  tableWidgetPropertyPaneMigrations,
  migrateTablePrimaryColumnsComputedValue,
  migrateTableWidgetDelimiterProperties,
  migrateTableWidgetSelectedRowBindings,
  migrateTableSanitizeColumnKeys,
  isSortableMigration,
  migrateTableWidgetIconButtonVariant,
} from "./migrations/TableWidget";
import {
  migrateTextStyleFromTextWidget,
  migrateScrollTruncateProperties,
} from "./migrations/TextWidget";
import { DATA_BIND_REGEX_GLOBAL } from "constants/BindingsConstants";
import { theme } from "constants/DefaultTheme";
import { getCanvasSnapRows } from "./WidgetPropsUtils";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { FetchPageResponse } from "api/PageApi";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
// import defaultTemplate from "templates/default";
import { renameKeyInObject } from "./helpers";
import { ColumnProperties } from "widgets/TableWidget/component/Constants";
import { migrateMenuButtonWidgetButtonProperties } from "./migrations/MenuButtonWidget";
import { ButtonStyleTypes, ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import {
  migrateModalIconButtonWidget,
  migrateResizableModalWidgetProperties,
} from "./migrations/ModalWidget";
import { migrateCheckboxGroupWidgetInlineProperty } from "./migrations/CheckboxGroupWidget";
import { migrateMapWidgetIsClickedMarkerCentered } from "./migrations/MapWidget";
import { DSLWidget } from "widgets/constants";
import { migrateRecaptchaType } from "./migrations/ButtonWidgetMigrations";
import { PrivateWidgets } from "entities/DataTree/dataTreeFactory";
import { migrateStylingPropertiesForTheming } from "./migrations/ThemingMigrations";

import {
  migratePhoneInputWidgetAllowFormatting,
  migratePhoneInputWidgetDefaultDialCode,
} from "./migrations/PhoneInputWidgetMigrations";
import { migrateCurrencyInputWidgetDefaultCurrencyCode } from "./migrations/CurrencyInputWidgetMigrations";
import { migrateRadioGroupAlignmentProperty } from "./migrations/RadioGroupWidget";
import { migrateCheckboxSwitchProperty } from "./migrations/PropertyPaneMigrations";
import { migrateChartWidgetReskinningData } from "./migrations/ChartWidgetReskinningMigrations";

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
    if (children.type === "LIST_WIDGET") {
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
 * adds 'privateWidgets' key for all list widgets
 *
 * @param currentDSL
 * @returns
 */
export const addPrivateWidgetsToAllListWidgets = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "LIST_WIDGET") {
      const privateWidgets: PrivateWidgets = {};
      Object.keys(child.template).forEach((entityName) => {
        privateWidgets[entityName] = true;
      });

      if (!child.privateWidgets) {
        set(child, `privateWidgets`, privateWidgets);
      }
    }
    return child;
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
  if (currentDSL.type === "LIST_WIDGET") {
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

const updateContainers = (dsl: ContainerWidgetProps<WidgetProps>) => {
  if (dsl.type === "CONTAINER_WIDGET" || dsl.type === "FORM_WIDGET") {
    if (
      !(
        dsl.children &&
        dsl.children.length > 0 &&
        (dsl.children[0].type === "CANVAS_WIDGET" ||
          dsl.children[0].type === "FORM_WIDGET")
      )
    ) {
      const canvas = {
        ...dsl,
        backgroundColor: "transparent",
        type: "CANVAS_WIDGET",
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
      // @ts-expect-error: Types are not available
      delete canvas.dynamicBindings;
      // @ts-expect-error: Types are not available
      delete canvas.dynamicProperties;
      if (canvas.children && canvas.children.length > 0)
        canvas.children = canvas.children.map(updateContainers);
      dsl.children = [{ ...canvas }];
    }
  }
  return dsl;
};

//transform chart data, from old chart widget to new chart widget
//updated chart widget has support for multiple series
const chartDataMigration = (currentDSL: ContainerWidgetProps<WidgetProps>) => {
  currentDSL.children = currentDSL.children?.map((children: WidgetProps) => {
    if (
      children.type === "CHART_WIDGET" &&
      children.chartData &&
      children.chartData.length &&
      !Array.isArray(children.chartData[0])
    ) {
      children.chartData = [{ data: children.chartData as ChartDataPoint[] }];
    } else if (
      children.type === "CONTAINER_WIDGET" ||
      children.type === "FORM_WIDGET" ||
      children.type === "CANVAS_WIDGET" ||
      children.type === "TABS_WIDGET"
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
    if (child.type === "CHART_WIDGET") {
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
    if (children.type === "MAP_WIDGET") {
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

const mapAllowHorizontalScrollMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "CHART_WIDGET") {
      child.allowScroll = child.allowHorizontalScroll;
      delete child.allowHorizontalScroll;
    }

    if (Array.isArray(child.children) && child.children.length > 0)
      child = mapAllowHorizontalScrollMigration(child);

    return child;
  });

  return currentDSL;
};

const tabsWidgetTabsPropertyMigration = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children
    ?.filter(Boolean)
    .map((child: WidgetProps) => {
      if (child.type === "TABS_WIDGET") {
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
    currentDSL.type === "CANVAS_WIDGET" &&
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
    currentDSL.type === "CANVAS_WIDGET" &&
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
  if (currentDSL.type === "RICH_TEXT_EDITOR_WIDGET") {
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
  if (currentDSL.type === "TABS_WIDGET" && currentDSL.version === 1) {
    try {
      currentDSL.type = "TABS_MIGRATOR_WIDGET";
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
    ["TABS_WIDGET", "TABS_MIGRATOR_WIDGET"].includes(currentDSL.type as any) &&
    currentDSL.version === 1
  ) {
    try {
      currentDSL.type = "TABS_WIDGET";
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
  if (currentDSL.type === "CHART_WIDGET") {
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
    if (children.type === "CHART_WIDGET") {
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
      children.type === "CONTAINER_WIDGET" ||
      children.type === "FORM_WIDGET" ||
      children.type === "CANVAS_WIDGET" ||
      children.type === "TABS_WIDGET"
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

export const calculateDynamicHeight = () => {
  const screenHeight = window.innerHeight;
  const gridRowHeight = GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  // DGRH - DEFAULT_GRID_ROW_HEIGHT
  // View Mode: Header height + Page Selection Tab = 8 * DGRH (approx)
  // Edit Mode: Header height + Canvas control = 8 * DGRH (approx)
  // buffer: ~8 grid row height
  const buffer =
    gridRowHeight +
    2 * pixelToNumber(theme.smallHeaderHeight) +
    pixelToNumber(theme.bottomBarHeight);
  const calculatedMinHeight =
    Math.floor((screenHeight - buffer) / gridRowHeight) * gridRowHeight;
  return calculatedMinHeight;
};

export const migrateInitialValues = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "INPUT_WIDGET") {
      child = {
        isRequired: false,
        isDisabled: false,
        resetOnSubmit: false,
        ...child,
      };
    } else if (child.type === "DROP_DOWN_WIDGET") {
      child = {
        isRequired: false,
        isDisabled: false,
        ...child,
      };
    } else if (child.type === "DATE_PICKER_WIDGET2") {
      child = {
        minDate: "2001-01-01 00:00",
        maxDate: "2041-12-31 23:59",
        isRequired: false,
        ...child,
      };
    } else if (child.type === "SWITCH_WIDGET") {
      child = {
        isDisabled: false,
        ...child,
      };
    } else if (child.type === "ICON_WIDGET") {
      child = {
        isRequired: false,
        ...child,
      };
    } else if (child.type === "VIDEO_WIDGET") {
      child = {
        isRequired: false,
        isDisabled: false,
        ...child,
      };
    } else if (child.type === "CHECKBOX_WIDGET") {
      child = {
        isDisabled: false,
        isRequired: false,
        ...child,
      };
    } else if (child.type === "RADIO_GROUP_WIDGET") {
      child = {
        isDisabled: false,
        isRequired: false,
        ...child,
      };
    } else if (child.type === "FILE_PICKER_WIDGET") {
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
export const transformDSL = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
  newPage = false,
) => {
  if (currentDSL.version === undefined) {
    // Since this top level widget is a CANVAS_WIDGET,
    // DropTargetComponent needs to know the minimum height the canvas can take
    // See DropTargetUtils.ts
    currentDSL.minHeight = calculateDynamicHeight();
    currentDSL.bottomRow =
      currentDSL.minHeight - GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    // For the first time the DSL is created, remove one row from the total possible rows
    // to adjust for padding and margins.
    currentDSL.snapRows =
      Math.floor(currentDSL.bottomRow / GridDefaults.DEFAULT_GRID_ROW_HEIGHT) -
      1;

    // Force the width of the canvas to 1224 px
    currentDSL.rightColumn = 1224;
    // The canvas is a CANVAS_WIDGET which doesn't have a background or borders by default
    currentDSL.backgroundColor = "none";
    currentDSL.containerStyle = "none";
    currentDSL.type = "CANVAS_WIDGET";
    currentDSL.detachFromLayout = true;
    currentDSL.canExtend = true;

    // Update version to make sure this doesn't run every time.
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
    if (!newPage) {
      currentDSL = migrateToNewLayout(currentDSL);
    }
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
    currentDSL = migrateDatePickerMinMaxDate(currentDSL);
    currentDSL.version = 27;
  }
  if (currentDSL.version === 27) {
    currentDSL = migrateFilterValueForDropDownWidget(currentDSL);
    currentDSL.version = 28;
  }

  if (currentDSL.version === 28) {
    currentDSL = migrateTablePrimaryColumnsComputedValue(currentDSL);
    currentDSL.version = 29;
  }

  if (currentDSL.version === 29) {
    currentDSL = migrateToNewMultiSelect(currentDSL);
    currentDSL.version = 30;
  }
  if (currentDSL.version === 30) {
    currentDSL = migrateTableWidgetDelimiterProperties(currentDSL);
    currentDSL.version = 31;
  }

  if (currentDSL.version === 31) {
    currentDSL = migrateIsDisabledToButtonColumn(currentDSL);
    currentDSL.version = 32;
  }

  if (currentDSL.version === 32) {
    currentDSL = migrateTableDefaultSelectedRow(currentDSL);
    currentDSL.version = 33;
  }

  if (currentDSL.version === 33) {
    currentDSL = migrateMenuButtonWidgetButtonProperties(currentDSL);
    currentDSL.version = 34;
  }

  if (currentDSL.version === 34) {
    currentDSL = migrateButtonWidgetValidation(currentDSL);
    currentDSL.version = 35;
  }

  if (currentDSL.version === 35) {
    currentDSL = migrateInputValidation(currentDSL);
    currentDSL.version = 36;
  }

  if (currentDSL.version === 36) {
    currentDSL = revertTableDefaultSelectedRow(currentDSL);
    currentDSL.version = 37;
  }

  if (currentDSL.version === 37) {
    currentDSL = migrateTableSanitizeColumnKeys(currentDSL);
    currentDSL.version = 38;
  }

  if (currentDSL.version === 38) {
    currentDSL = migrateResizableModalWidgetProperties(currentDSL);
    currentDSL.version = 39;
  }

  if (currentDSL.version === 39) {
    currentDSL = migrateTableWidgetSelectedRowBindings(currentDSL);
    currentDSL.version = 40;
  }

  if (currentDSL.version === 40) {
    currentDSL = revertButtonStyleToButtonColor(currentDSL);
    currentDSL.version = 41;
  }

  if (currentDSL.version === 41) {
    currentDSL = migrateButtonVariant(currentDSL);
    currentDSL.version = 42;
  }

  if (currentDSL.version === 42) {
    currentDSL = migrateMapWidgetIsClickedMarkerCentered(currentDSL);
    currentDSL.version = 43;
  }

  if (currentDSL.version === 43) {
    currentDSL = mapAllowHorizontalScrollMigration(currentDSL);
    currentDSL.version = 44;
  }
  if (currentDSL.version === 44) {
    currentDSL = isSortableMigration(currentDSL);
    currentDSL.version = 45;
  }

  if (currentDSL.version === 45) {
    currentDSL = migrateTableWidgetIconButtonVariant(currentDSL);
    currentDSL.version = 46;
  }

  if (currentDSL.version === 46) {
    currentDSL = migrateCheckboxGroupWidgetInlineProperty(currentDSL);
    currentDSL.version = 47;
  }

  if (currentDSL.version === 47) {
    // We're skipping this to fix a bad table migration.
    // skipped migration is added as version 51
    currentDSL.version = 48;
  }

  if (currentDSL.version === 48) {
    currentDSL = migrateRecaptchaType(currentDSL);
    currentDSL.version = 49;
  }

  if (currentDSL.version === 49) {
    currentDSL = addPrivateWidgetsToAllListWidgets(currentDSL);
    currentDSL.version = 50;
  }

  if (currentDSL.version === 50) {
    /*
     * We're skipping this to fix a bad table migration - migrateTableWidgetNumericColumnName
     * it overwrites the computedValue of the table columns
     */

    currentDSL.version = 51;
  }

  if (currentDSL.version === 51) {
    currentDSL = migratePhoneInputWidgetAllowFormatting(currentDSL);
    currentDSL.version = 52;
  }

  if (currentDSL.version === 52) {
    currentDSL = migrateModalIconButtonWidget(currentDSL);
    currentDSL.version = 53;
  }

  if (currentDSL.version === 53) {
    currentDSL = migrateScrollTruncateProperties(currentDSL);
    currentDSL.version = 54;
  }

  if (currentDSL.version === 54) {
    currentDSL = migratePhoneInputWidgetDefaultDialCode(currentDSL);
    currentDSL.version = 55;
  }

  if (currentDSL.version === 55) {
    currentDSL = migrateCurrencyInputWidgetDefaultCurrencyCode(currentDSL);
    currentDSL.version = 56;
  }

  if (currentDSL.version === 56) {
    currentDSL = migrateRadioGroupAlignmentProperty(currentDSL);
    currentDSL.version = 57;
  }

  if (currentDSL.version === 57) {
    currentDSL = migrateStylingPropertiesForTheming(currentDSL);
    currentDSL.version = 58;
  }

  if (currentDSL.version === 58) {
    currentDSL = migrateCheckboxSwitchProperty(currentDSL);
    currentDSL.version = LATEST_PAGE_VERSION;
  }

  if (currentDSL.version === 59) {
    currentDSL = migrateChartWidgetReskinningData(currentDSL);
    currentDSL.version = LATEST_PAGE_VERSION;
  }

  return currentDSL;
};

const migrateButtonVariant = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (
    currentDSL.type === "BUTTON_WIDGET" ||
    currentDSL.type === "FORM_BUTTON_WIDGET" ||
    currentDSL.type === "ICON_BUTTON_WIDGET"
  ) {
    switch (currentDSL.buttonVariant) {
      case "OUTLINE":
        currentDSL.buttonVariant = ButtonVariantTypes.SECONDARY;
        break;
      case "GHOST":
        currentDSL.buttonVariant = ButtonVariantTypes.TERTIARY;
        break;
      default:
        currentDSL.buttonVariant = ButtonVariantTypes.PRIMARY;
    }
  }
  if (currentDSL.type === "MENU_BUTTON_WIDGET") {
    switch (currentDSL.menuVariant) {
      case "OUTLINE":
        currentDSL.menuVariant = ButtonVariantTypes.SECONDARY;
        break;
      case "GHOST":
        currentDSL.menuVariant = ButtonVariantTypes.TERTIARY;
        break;
      default:
        currentDSL.menuVariant = ButtonVariantTypes.PRIMARY;
    }
  }
  if (currentDSL.type === "TABLE_WIDGET") {
    if (currentDSL.hasOwnProperty("primaryColumns")) {
      Object.keys(currentDSL.primaryColumns).forEach((column) => {
        if (currentDSL.primaryColumns[column].columnType === "iconButton") {
          let newVariant = ButtonVariantTypes.PRIMARY;
          switch (currentDSL.primaryColumns[column].buttonVariant) {
            case "OUTLINE":
              newVariant = ButtonVariantTypes.SECONDARY;
              break;
            case "GHOST":
              newVariant = ButtonVariantTypes.TERTIARY;
              break;
          }
          currentDSL.primaryColumns[column].buttonVariant = newVariant;
        }
      });
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child) =>
      migrateButtonVariant(child),
    );
  }
  return currentDSL;
};

export const revertTableDefaultSelectedRow = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === "TABLE_WIDGET") {
    if (currentDSL.version === 1 && currentDSL.defaultSelectedRow === "0")
      currentDSL.defaultSelectedRow = undefined;
    // update version to 3 for all table dsl
    currentDSL.version = 3;
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child) =>
      revertTableDefaultSelectedRow(child),
    );
  }
  return currentDSL;
};

export const revertButtonStyleToButtonColor = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (
    currentDSL.type === "BUTTON_WIDGET" ||
    currentDSL.type === "FORM_BUTTON_WIDGET" ||
    currentDSL.type === "ICON_BUTTON_WIDGET"
  ) {
    if (currentDSL.hasOwnProperty("buttonStyle")) {
      switch (currentDSL.buttonStyle) {
        case ButtonStyleTypes.DANGER:
          currentDSL.buttonColor = Colors.DANGER_SOLID;
          break;
        case ButtonStyleTypes.PRIMARY:
          currentDSL.buttonColor = Colors.GREEN;
          break;
        case ButtonStyleTypes.WARNING:
          currentDSL.buttonColor = Colors.WARNING_SOLID;
          break;
        case ButtonStyleTypes.INFO:
          currentDSL.buttonColor = Colors.INFO_SOLID;
          break;
        case ButtonStyleTypes.SECONDARY:
          currentDSL.buttonColor = Colors.GRAY;
          break;
        case "PRIMARY_BUTTON":
          currentDSL.buttonColor = Colors.GREEN;
          break;
        case "SECONDARY_BUTTON":
          currentDSL.buttonColor = Colors.GREEN;
          currentDSL.buttonVariant = ButtonVariantTypes.SECONDARY;
          break;
        case "DANGER_BUTTON":
          currentDSL.buttonColor = Colors.DANGER_SOLID;
          break;
        default:
          if (!currentDSL.buttonColor) currentDSL.buttonColor = Colors.GREEN;
          break;
      }
      delete currentDSL.buttonStyle;
    }
  }
  if (currentDSL.type === "MENU_BUTTON_WIDGET") {
    if (currentDSL.hasOwnProperty("menuStyle")) {
      switch (currentDSL.menuStyle) {
        case ButtonStyleTypes.DANGER:
          currentDSL.menuColor = Colors.DANGER_SOLID;
          break;
        case ButtonStyleTypes.PRIMARY:
          currentDSL.menuColor = Colors.GREEN;
          break;
        case ButtonStyleTypes.WARNING:
          currentDSL.menuColor = Colors.WARNING_SOLID;
          break;
        case ButtonStyleTypes.INFO:
          currentDSL.menuColor = Colors.INFO_SOLID;
          break;
        case ButtonStyleTypes.SECONDARY:
          currentDSL.menuColor = Colors.GRAY;
          break;
        default:
          if (!currentDSL.menuColor) currentDSL.menuColor = Colors.GREEN;
          break;
      }
      delete currentDSL.menuStyle;
      delete currentDSL.prevMenuStyle;
    }
  }
  if (currentDSL.type === "TABLE_WIDGET") {
    if (currentDSL.hasOwnProperty("primaryColumns")) {
      Object.keys(currentDSL.primaryColumns).forEach((column) => {
        if (currentDSL.primaryColumns[column].columnType === "button") {
          currentDSL.primaryColumns[column].buttonColor =
            currentDSL.primaryColumns[column].buttonStyle;
          delete currentDSL.primaryColumns[column].buttonStyle;
        }
      });
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child) =>
      revertButtonStyleToButtonColor(child),
    );
  }
  return currentDSL;
};

export const migrateInputValidation = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === "INPUT_WIDGET") {
    if (has(currentDSL, "validation")) {
      // convert boolean to string expression
      if (typeof currentDSL.validation === "boolean") {
        currentDSL.validation = String(currentDSL.validation);
      } else if (typeof currentDSL.validation !== "string") {
        // for any other type of value set to default undefined
        currentDSL.validation = undefined;
      }
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child) =>
      migrateInputValidation(child),
    );
  }
  return currentDSL;
};

const migrateButtonWidgetValidation = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === "INPUT_WIDGET") {
    if (!has(currentDSL, "validation")) {
      currentDSL.validation = true;
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children.map(
      (eachWidgetDSL: ContainerWidgetProps<WidgetProps>) => {
        migrateButtonWidgetValidation(eachWidgetDSL);
      },
    );
  }
  return currentDSL;
};

export const migrateTableDefaultSelectedRow = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === "TABLE_WIDGET") {
    if (!currentDSL.defaultSelectedRow) currentDSL.defaultSelectedRow = "0";
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child) =>
      migrateTableDefaultSelectedRow(child),
    );
  }
  return currentDSL;
};

const addIsDisabledToButtonColumn = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === "TABLE_WIDGET") {
    if (!isEmpty(currentDSL.primaryColumns)) {
      for (const key of Object.keys(
        currentDSL.primaryColumns as Record<string, ColumnProperties>,
      )) {
        if (currentDSL.primaryColumns[key].columnType === "button") {
          if (!currentDSL.primaryColumns[key].hasOwnProperty("isDisabled")) {
            currentDSL.primaryColumns[key]["isDisabled"] = false;
          }
        }
        if (!currentDSL.primaryColumns[key].hasOwnProperty("isCellVisible")) {
          currentDSL.primaryColumns[key]["isCellVisible"] = true;
        }
      }
    }
  }
  return currentDSL;
};

const migrateIsDisabledToButtonColumn = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  const newDSL = addIsDisabledToButtonColumn(currentDSL);

  newDSL.children = newDSL.children?.map((children: WidgetProps) => {
    return migrateIsDisabledToButtonColumn(children);
  });
  return currentDSL;
};

export const migrateToNewMultiSelect = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === "DROP_DOWN_WIDGET") {
    if (currentDSL.selectionType === "MULTI_SELECT") {
      currentDSL.type = "MULTI_SELECT_WIDGET";
      delete currentDSL.isFilterable;
    }
    delete currentDSL.selectionType;
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child) =>
      migrateToNewMultiSelect(child),
    );
  }
  return currentDSL;
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
      // TODO(abhinav): Figure out a way to get the correct values from the widgets
      const rightColumn = 4;
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
  if (currentDSL.type === "TABS_WIDGET" && currentDSL.version === 2) {
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
  const currentDSL = fetchPageResponse?.data.layouts[0].dsl;
  if (!currentDSL) return false;
  return currentDSL.version !== LATEST_PAGE_VERSION;
};

export const migrateDatePickerMinMaxDate = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === "DATE_PICKER_WIDGET2" && currentDSL.version === 2) {
    if (currentDSL.minDate === "2001-01-01 00:00") {
      currentDSL.minDate = "1920-12-31T18:30:00.000Z";
    }
    if (currentDSL.maxDate === "2041-12-31 23:59") {
      currentDSL.maxDate = "2121-12-31T18:29:00.000Z";
    }
  }
  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children.map(
      (eachWidgetDSL: ContainerWidgetProps<WidgetProps>) => {
        migrateDatePickerMinMaxDate(eachWidgetDSL);
      },
    );
  }
  return currentDSL;
};

const addFilterDefaultValue = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === "DROP_DOWN_WIDGET") {
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
