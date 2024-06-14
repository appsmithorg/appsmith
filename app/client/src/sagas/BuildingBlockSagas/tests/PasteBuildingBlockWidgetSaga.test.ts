import { BlueprintOperationTypes } from "WidgetProvider/constants";
import { PaginationType, PluginType, type Action } from "entities/Action";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import { cloneDeep } from "lodash";
import type {
  AllEffect,
  CallEffect,
  PutEffect,
  SelectEffect,
} from "redux-saga/effects";
import { call, select } from "redux-saga/effects";
import { getNewPositions } from "sagas/PasteWidgetUtils";
import { executeWidgetBlueprintBeforeOperations } from "sagas/WidgetBlueprintSagas";
import { getWidgets } from "sagas/selectors";
import {
  getCanvasWidth,
  getIsAutoLayoutMobileBreakPoint,
} from "selectors/editorSelectors";
import { getCopiedWidgets } from "utils/storage";
import { pasteBuildingBlockWidgetsSaga } from "../BuildingBlockAdditionSagas";
import {
  copiedWidgets,
  leftMostWidget,
  topMostWidget,
} from "../pasteWidgetAddition.fixture";

// Mock data for testing
const gridPosition = { top: 50, left: 500 };
const parentWidgetId = "parentWidgetId";
const newActions: Action[] = [
  {
    name: "fetch_users1",
    cacheResponse: "",
    datasource: {
      id: "66670c6c62c7c735c83c61d2",
      name: "Sample Database",
      pluginId: "656eeb1024ec7f5154c9ba00",
    },
    pageId: "666bff510e7df2453b7cfbcf",
    actionConfiguration: {
      timeoutInMillisecond: 10000,
      paginationType: PaginationType.NONE,
      body: 'SELECT * FROM user_data \nWHERE name ILIKE \'{{"%" + (tbl_usersCopy.searchText || "") + "%"}}\'\nAND dob >= \'{{dat_bornAfterCopy.selectedDate}}\'\n{{sel_countryCopy.selectedOptionValue !== "" ? "AND country = \'" + sel_countryCopy.selectedOptionValue + "\'" : ""}}\nORDER BY id\nOFFSET {{tbl_usersCopy.pageOffset}}\nLIMIT {{tbl_usersCopy.pageSize - 1}} ',
      pluginSpecifiedTemplates: [
        {
          value: false,
        },
      ],
    },
    executeOnLoad: true,
    dynamicBindingPathList: [
      {
        key: "body",
      },
    ],
    isValid: true,
    invalids: [],
    messages: [],
    jsonPathKeys: [
      "dat_bornAfterCopy.selectedDate",
      '"%" + (tbl_usersCopy.searchText || "") + "%"',
      "tbl_usersCopy.pageOffset",
      'sel_countryCopy.selectedOptionValue !== "" ? "AND country = \'" + sel_countryCopy.selectedOptionValue + "\'" : ""',
      "tbl_usersCopy.pageSize - 1",
    ],
    confirmBeforeExecute: false,
    userPermissions: [],
    id: "666bffd30e7df2453b7cfbd4",
    pluginId: "656eeb1024ec7f5154c9ba00",
    workspaceId: "66670c5162c7c735c83c61c9",
    pluginType: PluginType.DB,
  },
];

const totalWidth = 31;
const flexLayers: FlexLayer[] = [];

type ValueType =
  | Promise<any>
  | SelectEffect
  | CallEffect<any>
  | CallEffect<void>
  | AllEffect<any>
  | PutEffect<any>
  | any;

type GeneratorType = Generator<ValueType, void, unknown>;

describe("pasteBuildingBlockWidgetsSaga", () => {
  const copiedWidgetsResponse = { widgets: copiedWidgets, flexLayers };
  it("1. should handle pasting into a valid parent widget", () => {
    const generator: GeneratorType = pasteBuildingBlockWidgetsSaga(
      gridPosition,
      parentWidgetId,
      newActions,
    );

    // Step 1: call getCopiedWidgets()
    let result = generator.next();
    expect(result.value).toEqual(getCopiedWidgets());

    // Step 2: select getWidgets
    result = generator.next(copiedWidgetsResponse);
    expect(result.value).toEqual(select(getWidgets));

    // Step 3: select getIsAutoLayoutMobileBreakPoint
    const initialCanvasWidgets = {}; // Mock initial canvas widgets
    result = generator.next(initialCanvasWidgets);
    expect(result.value).toEqual(select(getIsAutoLayoutMobileBreakPoint));

    // Step 4: select getCanvasWidth
    result = generator.next(false); // Assume it's not the mobile breakpoint
    expect(result.value).toEqual(select(getCanvasWidth));

    // Mock data for the rest of the saga generator
    const mainCanvasWidth = 1200;
    const boundaryWidgets = {
      leftMostWidget,
      topMostWidget,
      totalWidth,
    };

    const newPastingPositionMap = {
      ppci5prygm: {
        id: "ppci5prygm",
        top: 1,
        left: 10,
        bottom: 65,
        right: 41,
        type: "CONTAINER_WIDGET",
      },
    };
    const reflowedMovementMap = undefined;
    const gridProps = {
      parentColumnSpace: 12.828080177307129,
      parentRowSpace: 10,
      maxGridColumns: 64,
    };

    // Step 5: compute getNewPositions
    result = generator.next(mainCanvasWidth);
    expect(result.value).toEqual(
      call(
        getNewPositions,
        copiedWidgets,
        boundaryWidgets.totalWidth,
        boundaryWidgets.topMostWidget.topRow,
        boundaryWidgets.leftMostWidget.leftColumn,
        { gridPosition },
        parentWidgetId,
      ),
    );

    // Step 6: execute blueprint operations before paste
    for (const widgetGroup of copiedWidgetsResponse.widgets) {
      result = generator.next({
        gridProps,
        newPastingPositionMap,
        reflowedMovementMap,
      });
      expect(result.value).toEqual(
        call(
          executeWidgetBlueprintBeforeOperations,
          BlueprintOperationTypes.BEFORE_PASTE,
          {
            parentId: parentWidgetId,
            widgetId: widgetGroup.widgetId,
            widgets: initialCanvasWidgets,
            widgetType: widgetGroup.list[0].type,
          },
        ),
      );
    }

    const newWidgetList = cloneDeep(copiedWidgets[0].list);

    // Step 7: mock the entire copied widget handling logic
    for (let i = 0; i < newWidgetList.length; i++) {
      result = generator.next("0123456789abcdef00000000");
    }

    result = generator.next();
    expect(result.done).toBe(true);
  });

  it("2. should handle errors gracefully", () => {
    const generator: GeneratorType = pasteBuildingBlockWidgetsSaga(
      { left: 0, top: 0 },
      "testParentId",
    );

    generator.next();
    // Introduce an error by throwing one manually
    const error = new Error("Something went wrong");
    try {
      generator.throw(error);
    } catch (err) {
      expect(err).toBe(error);
    }
  });
});
