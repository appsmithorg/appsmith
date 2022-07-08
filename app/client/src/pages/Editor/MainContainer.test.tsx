import React from "react";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { act, render, fireEvent } from "test/testUtils";
import GlobalHotKeys from "./GlobalHotKeys";
import { MemoryRouter } from "react-router-dom";
import * as utilities from "selectors/editorSelectors";
import store from "store";
import { sagasToRunForTests } from "test/sagas";
import { all } from "@redux-saga/core/effects";
import {
  MockApplication,
  mockGetCanvasWidgetDsl,
  syntheticTestMouseEvent,
} from "test/testCommon";
import lodash from "lodash";
import { getAbsolutePixels } from "utils/helpers";
import { UpdatedMainContainer } from "test/testMockedWidgets";
import { AppState } from "reducers";
import { generateReactKey } from "utils/generators";
import * as useDynamicAppLayoutHook from "utils/hooks/useDynamicAppLayout";

const renderNestedComponent = () => {
  const initialState = (store.getState() as unknown) as Partial<AppState>;
  const canvasId = "canvas-id";
  const containerId = "container-id";

  const children: any = buildChildren([
    {
      type: "INPUT_WIDGET_V2",
      dragDisabled: true,
      leftColumn: 0,
      topRow: 1,
      parentId: canvasId,
      rightColumn: 5,
      bottomRow: 2,
      text: "DRAG DISABLED INPUT",
    },
    {
      type: "TEXT_WIDGET",
      leftColumn: 0,
      parentId: canvasId,
      rightColumn: 5,
      bottomRow: 3,
      topRow: 2,
      text: "LABEL",
      widgetId: "text-widget",
    },
  ]);

  const canvasWidgetChildren: any = buildChildren([
    {
      type: "CANVAS_WIDGET",
      parentId: containerId,
      widgetId: canvasId,
      children,
    },
  ]);

  const containerWidgetChildren: any = buildChildren([
    {
      type: "CONTAINER_WIDGET",
      children: canvasWidgetChildren,
      parentId: "0",
      widgetId: containerId,
    },
  ]);

  const dsl: any = widgetCanvasFactory.build({
    children: containerWidgetChildren,
  });

  return render(
    <MemoryRouter
      initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
    >
      <MockApplication>
        <GlobalHotKeys>
          <UpdatedMainContainer dsl={dsl} />
        </GlobalHotKeys>
      </MockApplication>
    </MemoryRouter>,
    { initialState, sagasToRun: sagasToRunForTests },
  );
};

describe("Drag and Drop widgets into Main container", () => {
  const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
  const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");
  jest
    .spyOn(useDynamicAppLayoutHook, "useDynamicAppLayout")
    .mockImplementation(() => true);

  const pushState = jest.spyOn(window.history, "pushState");
  pushState.mockImplementation((state: any, title: any, url: any) => {
    window.document.title = title;
    window.location.pathname = url;
  });

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
        initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
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
      fireEvent.mouseOver(tabsWidget);
    });

    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    const mainCanvas: any = component.queryByTestId("div-dragarena-0");
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
        initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
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
      fireEvent.mouseOver(tabsWidget);
    });

    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    const mainCanvas: any = component.queryByTestId("div-dragarena-0");
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
        initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
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
      fireEvent.mouseOver(tabsWidget);
    });

    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    const mainCanvas: any = component.queryByTestId("div-dragarena-0");
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
        initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
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
      fireEvent.mouseOver(tabsWidget);
    });

    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    const mainCanvas: any = component.queryByTestId("div-dragarena-0");
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
        initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
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
    const allAddEntityButtons: any = component.container.querySelectorAll(
      ".t--entity-add-btn",
    );
    const widgetAddButton = allAddEntityButtons[1];
    act(() => {
      fireEvent.click(widgetAddButton);
    });
    const containerButton: any = component.queryAllByText("Container");

    act(() => {
      fireEvent.dragStart(containerButton[0]);
    });

    const mainCanvas: any = component.queryByTestId("div-dragarena-0");
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

  it("Disallow drag if widget not focused", () => {
    const initialState = (store.getState() as unknown) as Partial<AppState>;
    const containerId = generateReactKey();
    const canvasId = generateReactKey();

    const canvasWidget = buildChildren([
      {
        type: "CANVAS_WIDGET",
        parentId: containerId,
        children: [],
        widgetId: canvasId,
        dropDisabled: true,
      },
    ]);
    const containerChildren: any = buildChildren([
      {
        type: "CONTAINER_WIDGET",
        children: canvasWidget,
        widgetId: containerId,
        parentId: "0",
      },
    ]);

    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });

    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedMainContainer dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState, sagasToRun: sagasToRunForTests },
    );

    const widget: any = component.container.querySelector(
      ".t--widget-containerwidget",
    );
    const draggableWidget: any = component.container.querySelector(
      ".t--draggable-containerwidget",
    );

    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(1);

    const initWidgetPosition = {
      left: widget.style.left,
      top: widget.style.top,
    };

    act(() => {
      fireEvent.dragStart(draggableWidget);
    });

    let mainCanvas: any = component.queryByTestId("div-dragarena-0");
    expect(mainCanvas).toBeNull();

    // Focus on widget and drag
    act(() => {
      fireEvent.mouseOver(draggableWidget);
    });

    act(() => {
      fireEvent.dragStart(draggableWidget);
    });

    mainCanvas = component.queryByTestId("div-dragarena-0");
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 100,
            offsetY: 100,
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
    });

    const movedWidget: any = component.container.querySelector(
      ".t--widget-containerwidget",
    );
    const finalWidgetPosition = {
      left: movedWidget.style.left,
      top: movedWidget.style.top,
    };

    expect(finalWidgetPosition).not.toStrictEqual(initWidgetPosition);
  });

  afterAll(() => jest.resetModules());
});

describe("Drag in a nested container", () => {
  const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
  const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");

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

  it("container drags when focused on", () => {
    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = renderNestedComponent();

    const containerWidget: any = component.container.querySelector(
      ".t--widget-containerwidget",
    );
    const draggableContainerWidget: any = component.container.querySelector(
      ".t--draggable-containerwidget",
    );

    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(3);

    const initContainerWidgetPosition = {
      left: containerWidget.style.left,
      top: containerWidget.style.top,
    };

    act(() => {
      fireEvent.mouseOver(draggableContainerWidget);
    });

    act(() => {
      fireEvent.dragStart(draggableContainerWidget);
    });

    const mainCanvas: any = component.queryByTestId("div-dragarena-0");
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 100,
            offsetY: 100,
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
    });

    const movedContainerWidget: any = component.container.querySelector(
      ".t--widget-containerwidget",
    );
    const finalContainerWidgetPositions = {
      left: movedContainerWidget.style.left,
      top: movedContainerWidget.style.top,
    };

    expect(finalContainerWidgetPositions).not.toStrictEqual(
      initContainerWidgetPosition,
    );
  });

  it("nested widget drags when focused on", () => {
    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = renderNestedComponent();

    const textWidget: any = component.container.querySelector(
      ".t--widget-textwidget",
    );
    const draggableTextWidget: any = component.container.querySelector(
      ".t--draggable-textwidget",
    );

    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(3);

    const initTextWidgetPosition = {
      left: textWidget.style.left,
      top: textWidget.style.top,
    };

    act(() => {
      fireEvent.mouseOver(draggableTextWidget);
    });

    act(() => {
      fireEvent.dragStart(draggableTextWidget);
    });

    const mainCanvas: any = component.queryByTestId("div-dragarena-0");
    act(() => {
      fireEvent(
        mainCanvas,
        syntheticTestMouseEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
          }),
          {
            offsetX: 500,
            offsetY: 500,
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
    });

    const movedTextWidget: any = component.container.querySelector(
      ".t--widget-textwidget",
    );
    const finalTextWidgetPositions = {
      left: movedTextWidget.style.left,
      top: movedTextWidget.style.top,
    };

    expect(finalTextWidgetPositions).not.toStrictEqual(initTextWidgetPosition);
  });

  it("does not let disabledWidget drag and parent widget position stays same", () => {
    spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = renderNestedComponent();

    const inputWidget: any = component.container.querySelector(
      ".t--widget-inputwidgetv2",
    );
    const draggableInputWidget: any = component.container.querySelector(
      ".t--draggable-inputwidgetv2",
    );
    const draggableContainerWidget: any = component.container.querySelector(
      ".t--draggable-containerwidget",
    );

    const containerWidget: any = component.container.querySelector(
      ".t--widget-containerwidget",
    );

    const initContainerWidgetPosition = {
      left: containerWidget.style.left,
      top: containerWidget.style.top,
    };
    const initInputWidgetPosition = {
      left: inputWidget.style.left,
      top: inputWidget.style.top,
    };

    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(3);

    act(() => {
      fireEvent.mouseOver(draggableContainerWidget);
    });

    act(() => {
      fireEvent.mouseOver(draggableInputWidget);
    });

    act(() => {
      fireEvent.dragStart(draggableInputWidget);
    });

    const mainCanvas: any = component.queryByTestId("div-dragarena-0");

    if (mainCanvas) {
      act(() => {
        fireEvent(
          mainCanvas,
          syntheticTestMouseEvent(
            new MouseEvent("mousemove", {
              bubbles: true,
              cancelable: true,
            }),
            {
              offsetX: 500,
              offsetY: 500,
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
      });
    }

    const movedInputWidget: any = component.container.querySelector(
      ".t--widget-inputwidgetv2",
    );
    const finalInputWidgetPositions = {
      left: movedInputWidget.style.left,
      top: movedInputWidget.style.top,
    };

    const movedContainerWidget: any = component.container.querySelector(
      ".t--widget-containerwidget",
    );
    const finalContainerWidgetPositions = {
      left: movedContainerWidget.style.left,
      top: movedContainerWidget.style.top,
    };

    expect(finalInputWidgetPositions).toStrictEqual(initInputWidgetPosition);
    expect(initContainerWidgetPosition).toStrictEqual(
      finalContainerWidgetPositions,
    );
  });

  afterAll(() => jest.resetModules());
});
