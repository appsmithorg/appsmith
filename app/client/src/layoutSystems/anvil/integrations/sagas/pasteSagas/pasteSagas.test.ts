import { select } from "redux-saga/effects";
import { expectSaga } from "redux-saga-test-plan";
import { pasteWidgetSagas } from ".";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getCopiedWidgets } from "utils/storage";
import {
  getNextWidgetName,
  getSelectedWidgetWhenPasting,
} from "sagas/WidgetOperationUtils";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getWidgets } from "sagas/selectors";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getDataTree } from "selectors/dataTreeSelectors";
import { generateReactKey } from "utils/generators";
import { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import { registerLayoutComponents } from "layoutSystems/anvil/utils/layouts/layoutUtils";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

const cleanAllMocks = () => {
  jest.resetModules(); // Reset the module registry
  jest.clearAllMocks(); // Clears any mocked calls
  jest.restoreAllMocks(); // Restores initial implementations
};

// Mock the getCopiedWidgets function
jest.mock("utils/storage", () => ({
  ...jest.requireActual("utils/storage"),
  getCopiedWidgets: jest.fn(),
}));
// Mock the getSelectedWidgetWhenPasting function
jest.mock("sagas/WidgetOperationUtils", () => ({
  ...jest.requireActual("sagas/WidgetOperationUtils"),
  getNextWidgetName: jest.fn(),
  getSelectedWidgetWhenPasting: jest.fn(),
}));
// Mock only getDataTree
jest.mock("selectors/dataTreeSelectors", () => ({
  ...jest.requireActual("selectors/dataTreeSelectors"),
  getDataTree: jest.fn(),
}));
// Mock getLayoutSystemType of layoutSystemSelector
jest.mock("selectors/layoutSystemSelectors", () => ({
  ...jest.requireActual("selectors/layoutSystemSelectors"),
  getLayoutSystemType: jest.fn(),
}));
describe("pasteSagas", () => {
  const basePageId = "0123456789abcdef00000000";

  beforeAll(() => {
    registerLayoutComponents();
  });
  beforeEach(() => {
    cleanAllMocks();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getLayoutSystemType as jest.Mock<any, any>).mockReturnValue("ANVIL");
  });
  it("should perform paste operation with all necessary effects", async () => {
    // create mock data for copiedWidgets, selectedWidget, allWidgets
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const copiedWidgets: any = {
      widgets: [
        {
          list: [
            {
              widgetId: "widgetId",
              widgetName: "widgetName",
              type: "type",
            },
          ],
          widgetId: "widgetId",
        },
      ],
    };
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedWidget: any = { widgetId: MAIN_CONTAINER_WIDGET_ID };
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allWidgets: any = {
      widget1: { widgetId: "widget1", parentId: MAIN_CONTAINER_WIDGET_ID },
      [MAIN_CONTAINER_WIDGET_ID]: {
        widgetId: MAIN_CONTAINER_WIDGET_ID,
        layout: [
          {
            layoutId: generateReactKey(),
            layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
            layout: [],
          },
        ],
      },
    };

    // mock the return values of the functions
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getCopiedWidgets as jest.Mock<any, any>).mockResolvedValue(copiedWidgets);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getSelectedWidgetWhenPasting as jest.Mock<any, any>).mockReturnValue(
      selectedWidget,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getDataTree as jest.Mock<any, any>).mockReturnValue({
      widget1: {
        widgetName: "widget1",
      },
    });
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getNextWidgetName as jest.Mock<any, any>).mockReturnValue(
      "widgetNamecopy",
    );
    // run the saga
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { effects } = await expectSaga(pasteWidgetSagas as any)
      .provide([
        [select(getWidgets), allWidgets],
        [select(getCurrentBasePageId), basePageId],
      ])
      .run();

    // check the effects
    expect(effects.put).toHaveLength(3);
    const updateLayoutPut = effects.put[0].payload.action;

    expect(updateLayoutPut.type).toBe(ReduxActionTypes.UPDATE_LAYOUT);
    // check if a new widget is added to main canvas based on widget count on update
    expect(Object.keys(updateLayoutPut.payload.widgets).length).toBe(
      Object.keys(allWidgets).length + 1,
    );
    const recordRecentlyAddedWidgetPut = effects.put[1].payload.action;

    expect(recordRecentlyAddedWidgetPut.type).toBe(
      ReduxActionTypes.RECORD_RECENTLY_ADDED_WIDGET,
    );
    expect(recordRecentlyAddedWidgetPut.payload.length).toEqual(1);
    const selectWidgetInitActionPut = effects.put[2].payload.action;

    expect(selectWidgetInitActionPut.type).toBe(
      ReduxActionTypes.SELECT_WIDGET_INIT,
    );
    expect(selectWidgetInitActionPut.payload.selectionRequestType).toEqual(
      SelectionRequestType.Multiple,
    );
    expect(selectWidgetInitActionPut.payload.payload.length).toEqual(1);
  });
  it("should paste copied modals only to Main canvas", async () => {
    // Mock copiedWidgets data
    const copiedWidgets = {
      widgets: [
        {
          hierarchy: 2,
          list: [
            {
              widgetId: "1",
              widgetName: "1",
              detachFromLayout: true,
              type: "WDS_MODAL_WIDGET",
            },
          ],
          widgetId: "1",
        },
        {
          hierarchy: 1,
          list: [
            {
              widgetId: "2",
              widgetName: "2",
              type: "WDS_INPUT_WIDGET",
            },
          ],
          widgetId: "2",
        },
      ],
    };

    // Mock selectedWidget data
    const selectedWidget = { widgetId: "3", hierarchy: "WDS_INPUT_WIDGET" };

    // Mock getWidgets selector
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allWidgets: any = {
      1: {
        widgetId: "1",
        detachFromLayout: true,
        parentId: MAIN_CONTAINER_WIDGET_ID,
      },
      2: { widgetId: "2", parentId: MAIN_CONTAINER_WIDGET_ID },
      3: { widgetId: "3", parentId: MAIN_CONTAINER_WIDGET_ID },
      [MAIN_CONTAINER_WIDGET_ID]: {
        widgetId: MAIN_CONTAINER_WIDGET_ID,
        children: ["1", "2", "3"],
        layout: [
          {
            layoutId: generateReactKey(),
            layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
            layout: [],
          },
        ],
      },
    };

    // Mock the return values of the functions
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getCopiedWidgets as jest.Mock<any, any>).mockResolvedValue(copiedWidgets);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getSelectedWidgetWhenPasting as jest.Mock<any, any>).mockReturnValue(
      selectedWidget,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getDataTree as jest.Mock<any, any>).mockReturnValue({
      1: {
        widgetName: "1",
      },
      2: {
        widgetName: "2",
      },
      3: {
        widgetName: "3",
      },
    });
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getNextWidgetName as jest.Mock<any, any>).mockReturnValue(
      Math.random() + "widgetNamecopy",
    );
    // Run the saga
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { effects } = await expectSaga(pasteWidgetSagas as any)
      .provide([
        [select(getWidgets), allWidgets],
        [select(getCurrentBasePageId), basePageId],
      ])
      .run();

    // Check the effects
    expect(effects.put).toHaveLength(3);
    const updateLayoutPut = effects.put[0].payload.action;

    expect(updateLayoutPut.type).toBe(ReduxActionTypes.UPDATE_LAYOUT);
    // check if a new widget is added to main canvas based on widget count on update
    expect(Object.keys(updateLayoutPut.payload.widgets).length).toBe(
      Object.keys(allWidgets).length + 2,
    );
    const allUpdatedWidgets = Object.values(updateLayoutPut.payload.widgets);
    const allUpdatedModals = allUpdatedWidgets.filter(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (widget: any) => widget.type === "WDS_MODAL_WIDGET",
    );

    // Check if all modals are added to Main canvas
    expect(
      allUpdatedModals.every(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (each: any) => each.parentId === MAIN_CONTAINER_WIDGET_ID,
      ),
    ).toBe(true);
  });
});
