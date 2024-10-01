import type { AppState } from "ee/reducers";
import { all } from "@redux-saga/core/effects";
import lodash from "lodash";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import * as dataTreeSelectors from "selectors/dataTreeSelectors";
import * as utilities from "selectors/editorSelectors";
import store from "store";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { sagasToRunForTests } from "test/sagas";
import {
  MockApplication,
  mockCreateCanvasWidget,
  mockGetPagePermissions,
  mockGetWidgetEvalValues,
  syntheticTestMouseEvent,
} from "test/testCommon";
import { UpdatedEditor } from "test/testMockedWidgets";
import { act, fireEvent, render } from "test/testUtils";
import { generateReactKey } from "utils/generators";
import { getAbsolutePixels } from "utils/helpers";
import * as useCanvasWidthAutoResize from "pages/hooks";
import * as widgetRenderUtils from "utils/widgetRenderUtils";
import GlobalHotKeys from "../GlobalHotKeys";
import * as uiSelectors from "selectors/ui";

const pageId = "0123456789abcdef00000000";

const renderNestedComponent = () => {
  const initialState = store.getState() as unknown as Partial<AppState>;
  const canvasId = "canvas-id";
  const containerId = "container-id";

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasWidgetChildren: any = buildChildren([
    {
      type: "CANVAS_WIDGET",
      parentId: containerId,
      widgetId: canvasId,
      children,
    },
  ]);

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerWidgetChildren: any = buildChildren([
    {
      type: "CONTAINER_WIDGET",
      children: canvasWidgetChildren,
      parentId: "0",
      widgetId: containerId,
    },
  ]);

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsl: any = widgetCanvasFactory.build({
    children: containerWidgetChildren,
  });

  return render(
    <MemoryRouter
      initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
    >
      <MockApplication>
        <GlobalHotKeys>
          <UpdatedEditor dsl={dsl} />
        </GlobalHotKeys>
      </MockApplication>
    </MemoryRouter>,
    { initialState, sagasToRun: sagasToRunForTests },
  );
};

describe("Drag and Drop widgets into Main container", () => {
  const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");

  jest
    .spyOn(widgetRenderUtils, "createCanvasWidget")
    .mockImplementation(mockCreateCanvasWidget);
  jest
    .spyOn(dataTreeSelectors, "getWidgetEvalValues")
    .mockImplementation(mockGetWidgetEvalValues);
  jest
    .spyOn(utilities, "computeMainContainerWidget") // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation((widget) => widget as any);
  jest
    .spyOn(useCanvasWidthAutoResize, "useCanvasWidthAutoResize")
    .mockImplementation(() => true);

  const pushState = jest.spyOn(window.history, "pushState");

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pushState.mockImplementation((state: any, title: any, url: any) => {
    window.document.title = title;
    window.location.pathname = url;
  });

  // These need to be at the top to avoid imports not being mocked. ideally should be in setup.ts but will override for all other tests
  beforeAll(() => {
    const mockGenerator = function* () {
      yield all([]);
    };
    const debounceMocked = jest.spyOn(lodash, "debounce");

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    jest.mock("ee/sagas/PageSagas", () => ({
      ...jest.requireActual("ee/sagas/PageSagas"),
      default: mockGenerator,
    }));
  });

  it("Drag to move widgets", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 5,
        leftColumn: 5,
        rightColumn: 5,
        widgetId: "tabsWidgetId",
      },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });

    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedEditor dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const propPane = component.queryByTestId("t--propertypane");

    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");

    expect(canvasWidgets.length).toBe(1);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tabsWidget: any = component.container.querySelector(
      ".t--draggable-tabswidget",
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tab: any = component.container.querySelector(".t--widget-tabswidget");
    const initPositions = {
      left: tab.style.left,
      top: tab.style.top,
    };

    act(() => {
      fireEvent.mouseOver(tabsWidget);
    });

    jest
      .spyOn(uiSelectors, "getSelectedWidgets")
      .mockReturnValue(["tabsWidgetId"]);

    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 5,
        leftColumn: 5,
        rightColumn: 5,
      },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });

    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedEditor dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const propPane = component.queryByTestId("t--propertypane");

    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");

    expect(canvasWidgets.length).toBe(1);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tabsWidget: any = component.container.querySelector(
      ".t--draggable-tabswidget",
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // ToDO(Ashok): Check with Rahul if this test case is still relevant post reflow.

  // it("When widgets are colliding with other widgets move them back to previous position", () => {
  //   const children: any = buildChildren([
  //     {
  //       type: "TABS_WIDGET",
  //       topRow: 5,
  //       bottomRow: 15,
  //       leftColumn: 5,
  //       rightColumn: 15,
  //     },
  //     {
  //       type: "TABLE_WIDGET",
  //       topRow: 15,
  //       bottomRow: 25,
  //       leftColumn: 5,
  //       rightColumn: 15,
  //     },
  //   ]);
  //   const dsl: any = widgetCanvasFactory.build({
  //     children,
  //   });
  //   mockGetIsFetchingPage.mockImplementation(() => false);

  //   const component = render(
  //     <MemoryRouter
  //       initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
  //     >
  //       <MockApplication>
  //         <GlobalHotKeys>
  //           <UpdatedEditor dsl={dsl} />
  //         </GlobalHotKeys>
  //       </MockApplication>
  //     </MemoryRouter>,
  //     { initialState: store.getState(), sagasToRun: sagasToRunForTests },
  //   );
  //   const propPane = component.queryByTestId("t--propertypane");
  //   expect(propPane).toBeNull();
  //   const canvasWidgets = component.queryAllByTestId("test-widget");
  //   expect(canvasWidgets.length).toBe(2);
  //   const tabsWidget: any = component.container.querySelector(
  //     ".t--draggable-tabswidget",
  //   );
  //   const tab: any = component.container.querySelector(".t--widget-tabswidget");
  //   const initPositions = {
  //     left: tab.style.left,
  //     top: tab.style.top,
  //   };

  //   act(() => {
  //     fireEvent.mouseOver(tabsWidget);
  //   });

  //   act(() => {
  //     fireEvent.dragStart(tabsWidget);
  //   });

  //   const mainCanvas: any = component.queryByTestId("div-dragarena-0");
  //   act(() => {
  //     fireEvent(
  //       mainCanvas,
  //       syntheticTestMouseEvent(
  //         new MouseEvent("mousemove", {
  //           bubbles: true,
  //           cancelable: true,
  //         }),
  //         {
  //           offsetX: 0,
  //           offsetY: 0,
  //         },
  //       ),
  //     );
  //   });
  //   act(() => {
  //     fireEvent(
  //       mainCanvas,
  //       syntheticTestMouseEvent(
  //         new MouseEvent("mousemove", {
  //           bubbles: true,
  //           cancelable: true,
  //         }),
  //         {
  //           offsetX: 0,
  //           offsetY: 50,
  //         },
  //       ),
  //     );
  //     fireEvent(
  //       mainCanvas,
  //       syntheticTestMouseEvent(
  //         new MouseEvent("mouseup", {
  //           bubbles: true,
  //           cancelable: true,
  //         }),
  //       ),
  //     );
  //   });
  //   const movedTab: any = component.container.querySelector(
  //     ".t--widget-tabswidget",
  //   );
  //   const finalPositions = {
  //     left: movedTab.style.left,
  //     top: movedTab.style.top,
  //   };
  //   expect(finalPositions.left).toEqual(initPositions.left);
  //   expect(finalPositions.top).toEqual(initPositions.top);
  // });

  it("When widgets are out of bottom most bounds of parent canvas, canvas has to expand", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        widgetId: "tableWidgetId",
      },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });

    dsl.bottomRow = 250;

    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedEditor dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const propPane = component.queryByTestId("t--propertypane");

    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");

    expect(canvasWidgets.length).toBe(2);

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tabsWidget: any = component.container.querySelector(
      ".t--draggable-tablewidget",
    );

    act(() => {
      fireEvent.mouseOver(tabsWidget);
    });

    jest
      .spyOn(uiSelectors, "getSelectedWidgets")
      .mockReturnValue(["tableWidgetId"]);

    act(() => {
      fireEvent.dragStart(tabsWidget);
    });

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mainCanvas: any = component.queryByTestId("div-dragarena-0");
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dropTarget: any =
      component.container.getElementsByClassName("t--drop-target")[0];
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updatedDropTarget: any =
      component.container.getElementsByClassName("t--drop-target")[0];
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
    updatedDropTarget =
      component.container.getElementsByClassName("t--drop-target")[0];
    updatedLength = updatedDropTarget.style.height;
    expect(getAbsolutePixels(initialLength) + amountMovedY).toEqual(
      getAbsolutePixels(updatedLength),
    );
  });

  it("Drag and Drop widget into an empty canvas", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });

    mockGetIsFetchingPage.mockImplementation(() => false);
    jest
      .spyOn(utilities, "getPagePermissions")
      .mockImplementation(mockGetPagePermissions);
    const component = render(
      <MemoryRouter
        initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedEditor dsl={dsl} />
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerButton: any = component.queryAllByText("Container");

    act(() => {
      fireEvent.dragStart(containerButton[0]);
    });

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const initialState = store.getState() as unknown as Partial<AppState>;
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerChildren: any = buildChildren([
      {
        type: "CONTAINER_WIDGET",
        children: canvasWidget,
        widgetId: containerId,
        parentId: "0",
      },
    ]);

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });

    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = render(
      <MemoryRouter
        initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
      >
        <MockApplication>
          <GlobalHotKeys>
            <UpdatedEditor dsl={dsl} />
          </GlobalHotKeys>
        </MockApplication>
      </MemoryRouter>,
      { initialState, sagasToRun: sagasToRunForTests },
    );

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widget: any = component.container.querySelector(
      ".t--widget-containerwidget",
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const draggableWidget: any = component.container.querySelector(
      ".t--draggable-containerwidget",
    );

    const canvasWidgets = component.queryAllByTestId("test-widget");

    expect(canvasWidgets.length).toBe(1);

    const initWidgetPosition = {
      left: widget.style.left,
      top: widget.style.top,
    };

    jest
      .spyOn(uiSelectors, "getSelectedWidgets")
      .mockReturnValue([containerId]);

    act(() => {
      fireEvent.dragStart(draggableWidget);
    });

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // These need to be at the top to avoid imports not being mocked. ideally should be in setup.ts but will override for all other tests
  beforeAll(() => {
    const mockGenerator = function* () {
      yield all([]);
    };
    const debounceMocked = jest.spyOn(lodash, "debounce");

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    jest.mock("ee/sagas/PageSagas", () => ({
      ...jest.requireActual("ee/sagas/PageSagas"),
      default: mockGenerator,
    }));
  });

  it("container drags when focused on", () => {
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = renderNestedComponent();

    jest
      .spyOn(uiSelectors, "getSelectedWidgets")
      .mockReturnValue(["container-id"]);

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerWidget: any = component.container.querySelector(
      ".t--widget-containerwidget",
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = renderNestedComponent();

    jest
      .spyOn(uiSelectors, "getSelectedWidgets")
      .mockReturnValue(["text-widget"]);

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textWidget: any = component.container.querySelector(
      ".t--widget-textwidget",
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    mockGetIsFetchingPage.mockImplementation(() => false);

    const component = renderNestedComponent();

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputWidget: any = component.container.querySelector(
      ".t--widget-inputwidgetv2",
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const draggableInputWidget: any = component.container.querySelector(
      ".t--draggable-inputwidgetv2",
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const draggableContainerWidget: any = component.container.querySelector(
      ".t--draggable-containerwidget",
    );

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movedInputWidget: any = component.container.querySelector(
      ".t--widget-inputwidgetv2",
    );
    const finalInputWidgetPositions = {
      left: movedInputWidget.style.left,
      top: movedInputWidget.style.top,
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
