import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import GlobalHotKeys from "pages/Editor/GlobalHotKeys";
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
  mockGetWidgetEvalValues,
  MockPageDSL,
  syntheticTestMouseEvent,
} from "test/testCommon";
import { UpdatedEditor } from "test/testMockedWidgets";
import { act, fireEvent, render } from "test/testUtils";
import { generateReactKey } from "utils/generators";
import * as widgetRenderUtils from "utils/widgetRenderUtils";
import * as widgetSelectionsActions from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import Canvas from "pages/Editor/Canvas";

const pageId = "0123456789abcdef00000000";

describe("Canvas selection test cases", () => {
  jest
    .spyOn(dataTreeSelectors, "getWidgetEvalValues")
    .mockImplementation(mockGetWidgetEvalValues);
  jest
    .spyOn(utilities, "computeMainContainerWidget") // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation((widget) => widget as any);
  jest
    .spyOn(widgetRenderUtils, "createCanvasWidget")
    .mockImplementation(mockCreateCanvasWidget);

  const spyWidgetSelection = jest.spyOn(
    widgetSelectionsActions,
    "selectWidgetInitAction",
  );

  beforeEach(() => {
    spyWidgetSelection.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("Should select using canvas draw", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 30,
        leftColumn: 5,
        rightColumn: 30,
        widgetId: "tabsWidgetId",
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 5,
        bottomRow: 10,
        leftColumn: 40,
        rightColumn: 48,
        widgetId: "switchWidgetId",
      },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");

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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selectionCanvas: any = await component.findByTestId(
      `canvas-selection-${MAIN_CONTAINER_WIDGET_ID}`,
      undefined,
      { timeout: 3000 },
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  it("Should select all elements using canvas from top to bottom", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 1,
        bottomRow: 3,
        leftColumn: 1,
        rightColumn: 3,
        parentId: MAIN_CONTAINER_WIDGET_ID,
        widgetId: "tabsWidgetId",
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 1,
        bottomRow: 2,
        leftColumn: 5,
        rightColumn: 13,
        parentId: MAIN_CONTAINER_WIDGET_ID,
        widgetId: "switchWidgetId",
      },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");

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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectionDiv: any = await component.findByTestId(
      `div-selection-${MAIN_CONTAINER_WIDGET_ID}`,
      undefined,
      { timeout: 3000 },
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
    expect(spyWidgetSelection).toHaveBeenCalledWith(
      SelectionRequestType.Multiple,
      ["tabsWidgetId"],
    );

    expect(spyWidgetSelection).toHaveBeenCalledWith(
      SelectionRequestType.Multiple,
      ["tabsWidgetId", "switchWidgetId"],
    );
  });

  it("Should allow draw to select using cmd + draw in Container component", async () => {
    const containerId = generateReactKey();
    const canvasId = generateReactKey();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerChildren: any = buildChildren([
      {
        type: "CONTAINER_WIDGET",
        children: canvasWidget,
        widgetId: containerId,
        parentId: "0",
      },
      { type: "CHART_WIDGET", parentId: "0" },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");

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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selectionCanvas: any = await component.findByTestId(
      `canvas-selection-${canvasId}`,
      undefined,
      { timeout: 3000 },
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  it("Should not allow draw to select using cmd + draw in drop disabled Canvas component", async () => {
    const containerId = generateReactKey();
    const canvasId = generateReactKey();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerChildren: any = buildChildren([
      {
        type: "CONTAINER_WIDGET",
        children: canvasWidget,
        widgetId: containerId,
        parentId: "0",
      },
      { type: "CHART_WIDGET", parentId: "0" },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });

    const component = render(
      <MockPageDSL dsl={dsl}>
        <Canvas canvasWidth={dsl.rightColumn} widgetsStructure={dsl} />
      </MockPageDSL>,
    );

    let selectionCanvas;

    // TODO: Fix this the next time the file is edited
    try {
      // We actually want to assert the canvas component could not be found,
      // if the canvas component could not be found after timeout findByTestId will throw an error
      // In that case we set the component to be null
      selectionCanvas = await component.findByTestId(
        `canvas-${canvasId}`,
        undefined,
        { timeout: 3000 },
      );
    } catch (e) {
      selectionCanvas = null;
    }

    expect(selectionCanvas).toBeNull();
  });

  it("Should select all elements inside a CONTAINER using draw on canvas from top to bottom", async () => {
    const containerId = "containerWidget";
    const canvasId = "canvasWidget";
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        widgetId: "checkboxWidget",
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
        widgetId: "buttonWidget",
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      { type: "CHART_WIDGET", parentId: "0", widgetId: "chartWidget" },
    ]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");

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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectionDiv: any = await component.findByTestId(
      `div-selection-${canvasId}`,
      undefined,
      { timeout: 3000 },
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
    expect(spyWidgetSelection).toHaveBeenCalledWith(
      SelectionRequestType.Multiple,
      ["checkboxWidget", "buttonWidget"],
    );
  });

  it("Draw to select from outside of canvas(editor) ", async () => {
    const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 1,
        bottomRow: 3,
        leftColumn: 1,
        rightColumn: 3,
        parentId: MAIN_CONTAINER_WIDGET_ID,
        widgetId: "tabsWidgetId",
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 1,
        bottomRow: 2,
        leftColumn: 5,
        rightColumn: 13,
        parentId: MAIN_CONTAINER_WIDGET_ID,
        widgetId: "switchWidgetId",
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widgetEditor: any = await component.findByTestId(
      "t--widgets-editor",
      undefined,
      { timeout: 3000 },
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selectionCanvas: any = component.queryByTestId(
      `canvas-selection-${MAIN_CONTAINER_WIDGET_ID}`,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    jest.runOnlyPendingTimers();

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

    expect(spyWidgetSelection).toHaveBeenLastCalledWith(
      SelectionRequestType.Multiple,
      ["tabsWidgetId", "switchWidgetId"],
    );
  });
});
