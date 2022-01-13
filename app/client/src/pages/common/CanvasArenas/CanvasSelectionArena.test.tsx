import { act, fireEvent, render } from "test/testUtils";
import React from "react";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import {
  MockApplication,
  mockGetCanvasWidgetDsl,
  MockPageDSL,
  syntheticTestMouseEvent,
} from "test/testCommon";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { generateReactKey } from "utils/generators";
import store from "store";
import { sagasToRunForTests } from "test/sagas";
import GlobalHotKeys from "pages/Editor/GlobalHotKeys";
import { UpdatedMainContainer } from "test/testMockedWidgets";
import { MemoryRouter } from "react-router-dom";
import * as utilities from "selectors/editorSelectors";
import Canvas from "pages/Editor/Canvas";

describe("Canvas selection test cases", () => {
  it("Should select using canvas draw", () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 30,
        leftColumn: 5,
        rightColumn: 30,
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 5,
        bottomRow: 10,
        leftColumn: 40,
        rightColumn: 48,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
    const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");
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
    let selectionCanvas: any = component.queryByTestId(
      `canvas-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );
    const selectionDiv: any = component.queryByTestId(
      `div-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );
    expect(selectionCanvas.style.zIndex).toBe("");
    fireEvent.mouseDown(selectionDiv);

    selectionCanvas = component.queryByTestId(
      `canvas-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );

    expect(selectionCanvas.style.zIndex).toBe("2");
    fireEvent.mouseUp(selectionDiv);
    selectionCanvas = component.queryByTestId(
      `canvas-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );

    expect(selectionCanvas.style.zIndex).toBe("");
  });

  it("Should select all elements using canvas from top to bottom", () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 1,
        bottomRow: 3,
        leftColumn: 1,
        rightColumn: 3,
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 1,
        bottomRow: 2,
        leftColumn: 5,
        rightColumn: 13,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
    const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");
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
    const selectionDiv: any = component.queryByTestId(
      `div-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );
    fireEvent(
      selectionDiv,
      syntheticTestMouseEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        }),
        {
          offsetX: 10,
          offsetY: 10,
        },
      ),
    );
    fireEvent(
      selectionDiv,
      syntheticTestMouseEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
        }),
        {
          offsetX: dsl.rightColumn * 4,
          offsetY: dsl.bottomRow * 4,
        },
      ),
    );

    fireEvent(
      selectionDiv,
      syntheticTestMouseEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
        }),
        {
          offsetX: dsl.rightColumn * 4,
          offsetY: dsl.bottomRow * 4,
        },
      ),
    );
    const selectedWidgets = component.queryAllByTestId("t--selected");
    expect(selectedWidgets.length).toBe(2);
  });

  it("Should allow draw to select using cmd + draw in Container component", () => {
    const containerId = generateReactKey();
    const canvasId = generateReactKey();
    const children: any = buildChildren([
      { type: "CHECKBOX_WIDGET", parentId: canvasId },
      { type: "SWITCH_WIDGET", parentId: canvasId },
      { type: "BUTTON_WIDGET", parentId: canvasId },
    ]);
    const canvasWidget = buildChildren([
      {
        type: "CANVAS_WIDGET",
        parentId: containerId,
        children,
        widgetId: canvasId,
      },
    ]);
    const containerChildren: any = buildChildren([
      {
        type: "CONTAINER_WIDGET",
        children: canvasWidget,
        widgetId: containerId,
        parentId: "0",
      },
      { type: "CHART_WIDGET", parentId: "0" },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
    const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");
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
    let selectionCanvas: any = component.queryByTestId(
      `canvas-selection-${canvasId}`,
    );
    const selectionDiv: any = component.queryByTestId(
      `div-selection-${canvasId}`,
    );
    expect(selectionCanvas.style.zIndex).toBe("");
    fireEvent.mouseDown(selectionDiv);
    // should not allow draw when cmd/ctrl is not pressed
    selectionCanvas = component.queryByTestId(`canvas-selection-${canvasId}`);
    expect(selectionCanvas.style.zIndex).toBe("");
    fireEvent.mouseDown(selectionDiv, {
      metaKey: true,
    });

    selectionCanvas = component.queryByTestId(`canvas-selection-${canvasId}`);

    expect(selectionCanvas.style.zIndex).toBe("2");
    fireEvent.mouseUp(selectionDiv);
    selectionCanvas = component.queryByTestId(`canvas-selection-${canvasId}`);

    expect(selectionCanvas.style.zIndex).toBe("");
  });

  it("Should not allow draw to select using cmd + draw in drop disabled Canvas component", () => {
    const containerId = generateReactKey();
    const canvasId = generateReactKey();
    const children: any = buildChildren([
      { type: "CHECKBOX_WIDGET", parentId: canvasId },
      { type: "SWITCH_WIDGET", parentId: canvasId },
      { type: "BUTTON_WIDGET", parentId: canvasId },
    ]);
    const canvasWidget = buildChildren([
      {
        type: "CANVAS_WIDGET",
        parentId: containerId,
        children,
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
      { type: "CHART_WIDGET", parentId: "0" },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });

    const component = render(
      <MockPageDSL dsl={dsl}>
        <Canvas dsl={dsl} />
      </MockPageDSL>,
    );
    const selectionCanvas: any = component.queryByTestId(`canvas-${canvasId}`);
    expect(selectionCanvas).toBeNull();
  });

  it("Should select all elements inside a CONTAINER using draw on canvas from top to bottom", () => {
    const containerId = generateReactKey();
    const canvasId = generateReactKey();
    const children: any = buildChildren([
      {
        type: "CHECKBOX_WIDGET",
        parentColumnSpace: 10,
        parentRowSpace: 10,
        topRow: 1,
        bottomRow: 2,
        rightColumn: 1,
        leftColumn: 0,
        parentId: canvasId,
      },
      {
        type: "BUTTON_WIDGET",
        parentColumnSpace: 10,
        parentRowSpace: 10,
        topRow: 1,
        bottomRow: 3,
        rightColumn: 2,
        leftColumn: 1,
        parentId: canvasId,
      },
    ]);
    const canvasWidget = buildChildren([
      {
        type: "CANVAS_WIDGET",
        parentId: containerId,
        bottomRow: 20,
        rightColumn: 20,
        children,
        widgetId: canvasId,
      },
    ]);
    const containerChildren: any = buildChildren([
      {
        type: "CONTAINER_WIDGET",
        children: canvasWidget,
        widgetId: containerId,
        parentColumnSpace: 10,
        parentRowSpace: 10,
        bottomRow: 20,
        rightColumn: 20,
        parentId: "0",
      },
      { type: "CHART_WIDGET", parentId: "0" },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
    const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");
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

    const selectionDiv: any = component.queryByTestId(
      `div-selection-${canvasId}`,
    );
    fireEvent(
      selectionDiv,
      syntheticTestMouseEvent(
        new MouseEvent("mousedown", {
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
        {
          offsetX: 10,
          offsetY: 10,
        },
      ),
    );
    fireEvent(
      selectionDiv,
      syntheticTestMouseEvent(
        new MouseEvent("mousemove", {
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
        {
          offsetX: 800,
          offsetY: 800,
        },
      ),
    );

    fireEvent(
      selectionDiv,
      syntheticTestMouseEvent(
        new MouseEvent("mouseup", {
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
        {
          offsetX: 800,
          offsetY: 800,
        },
      ),
    );
    const selectedWidgets = component.queryAllByTestId("t--selected");
    expect(selectedWidgets.length).toBe(children.length);
  });

  it("Draw to select from outside of canvas(editor) ", () => {
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
    const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 1,
        bottomRow: 3,
        leftColumn: 1,
        rightColumn: 3,
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 1,
        bottomRow: 2,
        leftColumn: 5,
        rightColumn: 13,
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
    const widgetEditor: any = component.queryByTestId("widgets-editor");
    let selectionCanvas: any = component.queryByTestId(
      `canvas-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );
    const selectionDiv: any = component.queryByTestId(
      `div-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );
    expect(selectionCanvas.style.zIndex).toBe("");
    act(() => {
      fireEvent.dragStart(widgetEditor);
    });

    selectionCanvas = component.queryByTestId(
      `canvas-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );

    expect(selectionCanvas.style.zIndex).toBe("2");
    fireEvent.mouseEnter(selectionDiv);
    fireEvent.mouseUp(selectionDiv);
    selectionCanvas = component.queryByTestId(
      `canvas-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );

    expect(selectionCanvas.style.zIndex).toBe("");
    act(() => {
      fireEvent.dragStart(widgetEditor);
    });
    fireEvent.mouseEnter(selectionDiv);

    fireEvent(
      selectionDiv,
      syntheticTestMouseEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
        }),
        {
          offsetX: dsl.rightColumn * 4,
          offsetY: dsl.bottomRow * 4,
        },
      ),
    );

    fireEvent(
      selectionDiv,
      syntheticTestMouseEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
        }),
        {
          offsetX: dsl.rightColumn * 4,
          offsetY: dsl.bottomRow * 4,
        },
      ),
    );
    const selectedWidgets = component.queryAllByTestId("t--selected");
    expect(selectedWidgets.length).toBe(2);
  });
});
