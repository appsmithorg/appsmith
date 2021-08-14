import React from "react";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { act, render, fireEvent } from "test/testUtils";
import GlobalHotKeys from "./GlobalHotKeys";
import MainContainer from "./MainContainer";
import { MemoryRouter } from "react-router-dom";
import * as utilities from "selectors/editorSelectors";
import store from "store";
import { sagasToRunForTests } from "test/sagas";
import { all } from "@redux-saga/core/effects";
import {
  MockApplication,
  mockGetCanvasWidgetDsl,
  syntheticTestMouseEvent,
  useMockDsl,
} from "test/testCommon";
import lodash from "lodash";
import { getAbsolutePixels } from "utils/helpers";
describe("Drag and Drop widgets into Main container", () => {
  const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
  const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");

  function UpdatedMainContainer({ dsl }: any) {
    useMockDsl(dsl);
    return <MainContainer />;
  }
  // These need to be at the top to avoid imports not being mocked. ideally should be in setup.ts but will override for all other tests
  beforeAll(() => {
    const mockGenerator = function*() {
      yield all([]);
    };
    const debounceMocked = jest.spyOn(lodash, "debounce");
    debounceMocked.mockImplementation((fn: any) => fn);

    // top avoid the first middleware run which wud initiate all sagas.
    jest.mock("sagas", () => ({
      rootSaga: mockGenerator,
    }));

    // only the deafault exports are mocked to avoid overriding utilities exported out of them. defaults are marked to avoid worker initiation and page api calls in tests.
    jest.mock("sagas/EvaluationsSaga", () => ({
      ...jest.requireActual("sagas/EvaluationsSaga"),
      default: mockGenerator,
    }));
    jest.mock("sagas/PageSagas", () => ({
      ...jest.requireActual("sagas/PageSagas"),
      default: mockGenerator,
    }));
  });

  it("Drag to move widgets", () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 5,
        leftColumn: 5,
        rightColumn: 5,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={["/applications/app_id/pages/page_id/edit"]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedMainContainer dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const propPane = component.queryByTestId("t--propertypane");
    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(1);
    const tabsWidget: any = component.container.querySelector(
      ".t--draggable-tabswidget",
    );
    const tab: any = component.container.querySelector(".t--widget-tabswidget");
    const initPositions = {
      left: tab.style.left,
      top: tab.style.top,
    };
    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    const mainCanvas: any = component.queryByTestId("canvas-dragging-0");
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 0,
            offsetY: 0,
          },
        ),
      );
    });
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: -50,
            offsetY: -50,
          },
        ),
      );
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
          }),
        ),
      );
      jest.runAllTimers();
    });
    const movedTab: any = component.container.querySelector(
      ".t--widget-tabswidget",
    );
    const finalPositions = {
      left: movedTab.style.left,
      top: movedTab.style.top,
    };
    expect(finalPositions.left).not.toEqual(initPositions.left);
    expect(finalPositions.top).not.toEqual(initPositions.top);
  });

  it("When widgets are moved out of main container bounds move them back to previous position", () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 5,
        leftColumn: 5,
        rightColumn: 5,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={["/applications/app_id/pages/page_id/edit"]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedMainContainer dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const propPane = component.queryByTestId("t--propertypane");
    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(1);
    const tabsWidget: any = component.container.querySelector(
      ".t--draggable-tabswidget",
    );
    const tab: any = component.container.querySelector(".t--widget-tabswidget");
    const initPositions = {
      left: tab.style.left,
      top: tab.style.top,
    };
    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    const mainCanvas: any = component.queryByTestId("canvas-dragging-0");
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 0,
            offsetY: 0,
          },
        ),
      );
    });
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: -500,
            offsetY: -500,
          },
        ),
      );
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
          }),
        ),
      );
      jest.runAllTimers();
    });
    const movedTab: any = component.container.querySelector(
      ".t--widget-tabswidget",
    );
    const finalPositions = {
      left: movedTab.style.left,
      top: movedTab.style.top,
    };
    expect(finalPositions.left).toEqual(initPositions.left);
    expect(finalPositions.top).toEqual(initPositions.top);
  });

  it("When widgets are colliding with other widgets move them back to previous position", () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 15,
        leftColumn: 5,
        rightColumn: 15,
      },
      {
        type: "TABLE_WIDGET",
        topRow: 15,
        bottomRow: 25,
        leftColumn: 5,
        rightColumn: 15,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={["/applications/app_id/pages/page_id/edit"]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedMainContainer dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const propPane = component.queryByTestId("t--propertypane");
    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(2);
    const tabsWidget: any = component.container.querySelector(
      ".t--draggable-tabswidget",
    );
    const tab: any = component.container.querySelector(".t--widget-tabswidget");
    const initPositions = {
      left: tab.style.left,
      top: tab.style.top,
    };
    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    const mainCanvas: any = component.queryByTestId("canvas-dragging-0");
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 0,
            offsetY: 0,
          },
        ),
      );
    });
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 0,
            offsetY: 50,
          },
        ),
      );
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
          }),
        ),
      );
      jest.runAllTimers();
    });
    const movedTab: any = component.container.querySelector(
      ".t--widget-tabswidget",
    );
    const finalPositions = {
      left: movedTab.style.left,
      top: movedTab.style.top,
    };
    expect(finalPositions.left).toEqual(initPositions.left);
    expect(finalPositions.top).toEqual(initPositions.top);
  });

  it("When widgets are out of bottom most bounds of parent canvas, canvas has to expand", () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 15,
        leftColumn: 5,
        rightColumn: 15,
      },
      {
        type: "TABLE_WIDGET",
        topRow: 15,
        bottomRow: 25,
        leftColumn: 5,
        rightColumn: 15,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    dsl.bottomRow = 250;
    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={["/applications/app_id/pages/page_id/edit"]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedMainContainer dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const propPane = component.queryByTestId("t--propertypane");
    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(2);

    const tabsWidget: any = component.container.querySelector(
      ".t--draggable-tablewidget",
    );

    act(() => {
      fireEvent.dragStart(tabsWidget);
      //   jest.runAllTimers();
    });

    const mainCanvas: any = component.queryByTestId("canvas-dragging-0");
    const dropTarget: any = component.container.getElementsByClassName(
      "t--drop-target",
    )[0];
    let initialLength = dropTarget.style.height;
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 0,
            offsetY: 0,
          },
        ),
      );
    });
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 0,
            offsetY: 300,
            // min height - (component height + bottom row)
          },
        ),
      );
      jest.runAllTimers();
    });
    let updatedDropTarget: any = component.container.getElementsByClassName(
      "t--drop-target",
    )[0];
    let updatedLength = updatedDropTarget.style.height;

    expect(initialLength).not.toEqual(updatedLength);
    initialLength = updatedLength;
    const amountMovedY = 300;
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 0,
            offsetY: 300 + amountMovedY,
          },
        ),
      );
      jest.runAllTimers();
    });
    updatedDropTarget = component.container.getElementsByClassName(
      "t--drop-target",
    )[0];
    updatedLength = updatedDropTarget.style.height;
    expect(getAbsolutePixels(initialLength) + amountMovedY).toEqual(
      getAbsolutePixels(updatedLength),
    );
  });

  it("Drag and Drop widget into an empty canvas", () => {
    const children: any = buildChildren([]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={["/applications/app_id/pages/page_id/edit"]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedMainContainer dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const propPane = component.queryByTestId("t--propertypane");
    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");
    // empty canvas
    expect(canvasWidgets.length).toBe(0);
    const allAddEntityButtons: any = component.queryAllByText("+");
    const widgetAddButton = allAddEntityButtons[1];
    act(() => {
      fireEvent.click(widgetAddButton);
      // jest.runAllTimers();
    });
    const containerButton: any = component.queryByText("Container");

    act(() => {
      fireEvent.dragStart(containerButton);
    });

    const mainCanvas: any = component.queryByTestId("canvas-dragging-0");
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 200,
            offsetY: 200,
          },
        ),
      );
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 200,
            offsetY: 200,
          },
        ),
      );
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 200,
            offsetY: 200,
          },
        ),
      );
    });
    const newlyAddedCanvas = component.container.querySelectorAll(
      "div[type='CONTAINER_WIDGET']",
    );
    expect(newlyAddedCanvas.length).toBe(1);
  });

  afterAll(() => jest.resetModules());
});
