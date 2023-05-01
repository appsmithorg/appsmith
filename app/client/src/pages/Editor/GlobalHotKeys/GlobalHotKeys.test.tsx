import React from "react";
import { Slide } from "react-toastify";

import {
  createMessage,
  SAVE_HOTKEY_TOASTER_MESSAGE,
} from "@appsmith/constants/messages";
import { all } from "@redux-saga/core/effects";
import { redoAction, undoAction } from "actions/pageActions";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { StyledToastContainer } from "design-system-old";
import { MemoryRouter } from "react-router-dom";
import * as utilities from "selectors/editorSelectors";
import * as dataTreeSelectors from "selectors/dataTreeSelectors";
import store, { runSagaMiddleware } from "store";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { sagasToRunForTests } from "test/sagas";
import {
  dispatchTestKeyboardEventWithCode,
  MockApplication,
  mockCreateCanvasWidget,
  mockGetCanvasWidgetDsl,
  mockGetChildWidgets,
  mockGetWidgetEvalValues,
  MockPageDSL,
  useMockDsl,
} from "test/testCommon";
import { MockCanvas } from "test/testMockedWidgets";
import { act, fireEvent, render, waitFor } from "test/testUtils";
import { generateReactKey } from "utils/generators";
import * as widgetRenderUtils from "utils/widgetRenderUtils";
import MainContainer from "../MainContainer";
import GlobalHotKeys from "./GlobalHotKeys";
import * as widgetSelectionsActions from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import * as widgetActions from "actions/widgetActions";
import * as uiSelectors from "selectors/ui";
import { NavigationMethod } from "../../../utils/history";

jest.mock("constants/routes", () => {
  return {
    ...jest.requireActual("constants/routes"),
    matchBuilderPath: () => true,
  };
});

describe("Canvas Hot Keys", () => {
  beforeAll(() => {
    runSagaMiddleware();
  });

  const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
  const spyGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");
  const spyGetChildWidgets = jest.spyOn(utilities, "getChildWidgets");
  const spyCreateCanvasWidget = jest.spyOn(
    widgetRenderUtils,
    "createCanvasWidget",
  );

  function UpdatedEditor({ dsl }: any) {
    useMockDsl(dsl);
    return <MainContainer />;
  }

  // These need to be at the top to avoid imports not being mocked. ideally should be in setup.ts but will override for all other tests
  beforeAll(() => {
    const mockGenerator = function* () {
      yield all([]);
    };

    // top avoid the first middleware run which wud initiate all sagas.
    jest.mock("sagas", () => ({
      rootSaga: mockGenerator,
    }));

    // only the default exports are mocked to avoid overriding utilities exported out of them. defaults are marked to avoid worker initiation and page api calls in tests.
    jest.mock("sagas/EvaluationsSaga", () => ({
      ...jest.requireActual("sagas/EvaluationsSaga"),
      default: mockGenerator,
    }));
    jest.mock("sagas/PageSagas", () => ({
      ...jest.requireActual("sagas/PageSagas"),
      default: mockGenerator,
    }));
  });

  describe("Select all hotkey", () => {
    jest
      .spyOn(widgetRenderUtils, "createCanvasWidget")
      .mockImplementation(mockCreateCanvasWidget);
    jest
      .spyOn(dataTreeSelectors, "getWidgetEvalValues")
      .mockImplementation(mockGetWidgetEvalValues);
    jest
      .spyOn(utilities, "computeMainContainerWidget")
      .mockImplementation((widget) => widget as any);

    it("Cmd + A - select all widgets on canvas", async () => {
      const children: any = buildChildren([
        {
          type: "TABS_WIDGET",
          parentId: MAIN_CONTAINER_WIDGET_ID,
          widgetId: "tabsWidgetId",
        },
        {
          type: "SWITCH_WIDGET",
          parentId: MAIN_CONTAINER_WIDGET_ID,
          widgetId: "switchWidgetId",
        },
      ]);
      const dsl: any = widgetCanvasFactory.build({
        children,
      });
      spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
      mockGetIsFetchingPage.mockImplementation(() => false);
      const spyWidgetSelection = jest.spyOn(
        widgetSelectionsActions,
        "selectWidgetInitAction",
      );

      const spyPaste = jest.spyOn(widgetActions, "pasteWidget");

      const component = render(
        <MemoryRouter
          initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
        >
          <MockApplication>
            <GlobalHotKeys
              getMousePosition={() => {
                return { x: 0, y: 0 };
              }}
            >
              <UpdatedEditor dsl={dsl} />
            </GlobalHotKeys>
          </MockApplication>
        </MemoryRouter>,
        { initialState: store.getState(), sagasToRun: sagasToRunForTests },
      );
      const canvasWidgets = component.queryAllByTestId("test-widget");
      expect(canvasWidgets.length).toBe(2);
      act(() => {
        if (canvasWidgets[0].firstChild) {
          fireEvent.mouseOver(canvasWidgets[0].firstChild);
          fireEvent.click(canvasWidgets[0].firstChild);
        }
      });
      const tabsWidgetName: any =
        component.container.querySelector(`span.t--widget-name`);
      fireEvent.click(tabsWidgetName);
      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.One,
        ["tabsWidgetId"],
        NavigationMethod.CanvasClick,
        undefined,
      );
      spyWidgetSelection.mockClear();

      const artBoard: any = component.queryByTestId("t--canvas-artboard");
      // deselect all other widgets
      fireEvent.click(artBoard);
      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.Empty,
        [],
        NavigationMethod.CanvasClick,
      );
      spyWidgetSelection.mockClear();

      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "A",
        65,
        false,
        true,
      );
      expect(spyWidgetSelection).toHaveBeenCalledWith(SelectionRequestType.All);
      spyWidgetSelection.mockClear();
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "escape",
        27,
        false,
        false,
      );
      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.Empty,
      );
      spyWidgetSelection.mockClear();
      act(() => {
        dispatchTestKeyboardEventWithCode(
          component.container,
          "keydown",
          "A",
          65,
          false,
          true,
        );
      });

      expect(spyWidgetSelection).toHaveBeenCalledWith(SelectionRequestType.All);
      spyWidgetSelection.mockClear();
      act(() => {
        dispatchTestKeyboardEventWithCode(
          component.container,
          "keydown",
          "C",
          67,
          false,
          true,
        );
      });
      act(() => {
        dispatchTestKeyboardEventWithCode(
          component.container,
          "keydown",
          "V",
          86,
          false,
          true,
        );
      });

      expect(spyPaste).toHaveBeenCalled();
    });
    it.skip("Cmd + A - select all widgets inside last selected container", async () => {
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
      spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
      mockGetIsFetchingPage.mockImplementation(() => false);
      const spyWidgetSelection = jest.spyOn(
        widgetSelectionsActions,
        "selectWidgetInitAction",
      );

      const component = render(
        <MemoryRouter
          initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
        >
          <MockApplication>
            <GlobalHotKeys
              getMousePosition={() => {
                return { x: 0, y: 0 };
              }}
            >
              <UpdatedEditor dsl={dsl} />
            </GlobalHotKeys>
          </MockApplication>
        </MemoryRouter>,
        { initialState: store.getState(), sagasToRun: sagasToRunForTests },
      );
      const canvasWidgets = component.queryAllByTestId("test-widget");
      expect(canvasWidgets.length).toBe(5);
      if (canvasWidgets[0].firstChild) {
        fireEvent.mouseOver(canvasWidgets[0].firstChild);
        fireEvent.click(canvasWidgets[0].firstChild);
      }
      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.One,
        ["tabsWidgetId"],
        undefined,
      );
      spyWidgetSelection.mockClear();

      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "A",
        65,
        false,
        true,
      );

      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.One,
        ["tabsWidgetId"],
        undefined,
        undefined,
      );
      spyWidgetSelection.mockClear();
    });
    it.skip("Cmd + A - select all widgets inside a form", async () => {
      spyGetChildWidgets.mockImplementation(mockGetChildWidgets);
      const children: any = buildChildren([
        { type: "FORM_WIDGET", parentId: MAIN_CONTAINER_WIDGET_ID },
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
            <GlobalHotKeys
              getMousePosition={() => {
                return { x: 0, y: 0 };
              }}
            >
              <UpdatedEditor dsl={dsl} />
            </GlobalHotKeys>
          </MockApplication>
        </MemoryRouter>,
        { initialState: store.getState(), sagasToRun: sagasToRunForTests },
      );
      const propPane = component.queryByTestId("t--propertypane");
      expect(propPane).toBeNull();
      const canvasWidgets = component.queryAllByTestId("test-widget");
      expect(canvasWidgets.length).toBe(4);
      if (canvasWidgets[0].firstChild) {
        fireEvent.mouseOver(canvasWidgets[0].firstChild);
        fireEvent.click(canvasWidgets[0].firstChild);
      }

      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "A",
        65,
        false,
        true,
      );
      const selectedWidgets = component.queryAllByTestId("t--selected");
      expect(selectedWidgets.length).toBe(3);
    });
    it.skip("Cmd + A - select all widgets inside a list", async () => {
      const listId = generateReactKey();
      const containerId = generateReactKey();
      const canvasId = generateReactKey();
      const listCanvasId = generateReactKey();
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
          bottomRow: 20,
        },
      ]);
      const containerChildren: any = buildChildren([
        {
          type: "CONTAINER_WIDGET",
          children: canvasWidget,
          widgetId: containerId,
          parentId: listCanvasId,
          dropDisabled: true,
          bottomRow: 4,
        },
      ]);
      const listCanvasChildren: any = buildChildren([
        {
          type: "CANVAS_WIDGET",
          children: containerChildren,
          widgetId: listCanvasId,
          dropDisabled: true,
          parentId: listId,
          bottomRow: 20,
        },
      ]);
      const listChildren: any = buildChildren([
        {
          type: "LIST_WIDGET",
          children: listCanvasChildren,
          widgetId: listId,
          parentId: "0",
        },
      ]);
      const dsl: any = widgetCanvasFactory.build({
        children: listChildren,
      });
      spyGetCanvasWidgetDsl.mockImplementation(mockGetCanvasWidgetDsl);
      mockGetIsFetchingPage.mockImplementation(() => false);
      spyGetChildWidgets.mockImplementation(mockGetChildWidgets);
      spyCreateCanvasWidget.mockImplementation(mockCreateCanvasWidget);

      const component = render(
        <MemoryRouter
          initialEntries={["/app/applicationSlug/pageSlug-page_id/edit"]}
        >
          <MockApplication>
            <GlobalHotKeys
              getMousePosition={() => {
                return { x: 0, y: 0 };
              }}
            >
              <UpdatedEditor dsl={dsl} />
            </GlobalHotKeys>
          </MockApplication>
        </MemoryRouter>,
        { initialState: store.getState(), sagasToRun: sagasToRunForTests },
      );
      const propPane = component.queryByTestId("t--propertypane");
      expect(propPane).toBeNull();
      const canvasWidgets = component.queryAllByTestId("test-widget");

      if (canvasWidgets[0].firstChild) {
        fireEvent.mouseOver(canvasWidgets[0].firstChild);
        fireEvent.click(canvasWidgets[0].firstChild);
      }

      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "A",
        65,
        false,
        true,
      );
      const selectedWidgets = component.queryAllByTestId("t--selected");
      expect(selectedWidgets.length).toBe(3);
    });
  });

  afterAll(() => jest.resetModules());
});

describe("Cut/Copy/Paste hotkey", () => {
  const spyWidgetSelection = jest.spyOn(
    widgetSelectionsActions,
    "selectWidgetInitAction",
  );
  const spyCut = jest.spyOn(widgetActions, "cutWidget");
  const spyCopy = jest.spyOn(widgetActions, "copyWidget");
  const spyPaste = jest.spyOn(widgetActions, "pasteWidget");

  jest.spyOn(uiSelectors, "getSelectedWidgets").mockReturnValue(["testWidget"]);

  beforeEach(() => {
    spyWidgetSelection.mockClear();
    spyCut.mockClear();
    spyCopy.mockClear();
    spyPaste.mockClear();
  });
  it("Should copy and paste all selected widgets with hotkey cmd + c and cmd + v ", async () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 30,
        leftColumn: 5,
        rightColumn: 30,
        parentId: MAIN_CONTAINER_WIDGET_ID,
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 5,
        bottomRow: 10,
        leftColumn: 40,
        rightColumn: 48,
        parentId: MAIN_CONTAINER_WIDGET_ID,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
        >
          <MockCanvas />
        </GlobalHotKeys>
      </MockPageDSL>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    const artBoard: any = await component.queryByTestId("t--canvas-artboard");
    // deselect all other widgets
    fireEvent.click(artBoard);
    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "A",
        65,
        false,
        true,
      );
    });

    expect(spyWidgetSelection).toBeCalledWith(SelectionRequestType.All);

    // jest.spyOn(sagaSelectors, "getWidgetMetaProps").mockReturnValue({});
    //
    // let selectedWidgets = await component.queryAllByTestId("t--selected");
    // expect(selectedWidgets.length).toBe(2);
    // jest.spyOn(sagaSelectors, "getWidgetMetaProps").mockReturnValue({});
    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "C",
        67,
        false,
        true,
      );
    });
    expect(spyCopy).toBeCalled();
    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "V",
        86,
        false,
        true,
      );
    });
    expect(spyPaste).toBeCalled();

    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "A",
        65,
        false,
        true,
      );
    });

    expect(spyWidgetSelection).toBeCalledWith(SelectionRequestType.All);
  });
  it("Should cut and paste all selected widgets with hotkey cmd + x and cmd + v ", async () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 5,
        bottomRow: 30,
        leftColumn: 5,
        rightColumn: 30,
        parentId: MAIN_CONTAINER_WIDGET_ID,
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 5,
        bottomRow: 10,
        leftColumn: 40,
        rightColumn: 48,
        parentId: MAIN_CONTAINER_WIDGET_ID,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
        >
          <MockCanvas />
        </GlobalHotKeys>
      </MockPageDSL>,
    );
    const artBoard: any = await component.queryByTestId("t--canvas-artboard");
    // deselect all other widgets
    fireEvent.click(artBoard);
    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "A",
        65,
        false,
        true,
      );
    });

    expect(spyWidgetSelection).toBeCalledWith(SelectionRequestType.All);

    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "X",
        88,
        false,
        true,
      );
    });
    expect(spyCut).toBeCalled();

    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "V",
        86,
        false,
        true,
      );
    });

    expect(spyPaste).toBeCalled();
  });
});

describe("Undo/Redo hotkey", () => {
  it("should dispatch undo Action on cmd + z", () => {
    const dispatchSpy = jest.spyOn(store, "dispatch");
    const component = render(
      <MockPageDSL>
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
        >
          <MockCanvas />
        </GlobalHotKeys>
      </MockPageDSL>,
    );

    dispatchSpy.mockClear();

    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "Z",
        90,
        false,
        true,
      );
    });

    expect(dispatchSpy).toBeCalledTimes(1);
    expect(dispatchSpy).toBeCalledWith(undoAction());
  });
  it("should dispatch redo Action on cmd + shift + z", () => {
    const dispatchSpy = jest.spyOn(store, "dispatch");
    const component = render(
      <MockPageDSL>
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
        >
          <MockCanvas />
        </GlobalHotKeys>
      </MockPageDSL>,
    );

    dispatchSpy.mockClear();

    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "Z",
        90,
        true,
        true,
      );
    });

    expect(dispatchSpy).toBeCalledTimes(1);
    expect(dispatchSpy).toBeCalledWith(redoAction());
  });
  it("should dispatch redo Action on ctrl + y", () => {
    const dispatchSpy = jest.spyOn(store, "dispatch");
    const component = render(
      <MockPageDSL>
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
        >
          <MockCanvas />
        </GlobalHotKeys>
      </MockPageDSL>,
    );

    dispatchSpy.mockClear();

    act(() => {
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "Y",
        89,
        false,
        true,
      );
    });

    expect(dispatchSpy).toBeCalledTimes(1);
    expect(dispatchSpy).toBeCalledWith(redoAction());
  });
});

describe("cmd + s hotkey", () => {
  it("Should render toast message", async () => {
    const component = render(
      <>
        <StyledToastContainer
          autoClose={5000}
          closeButton={false}
          draggable={false}
          hideProgressBar
          pauseOnHover={false}
          transition={Slide}
        />
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
        >
          <div />
        </GlobalHotKeys>
      </>,
    );

    dispatchTestKeyboardEventWithCode(
      component.container,
      "keydown",
      "s",
      83,
      false,
      true,
    );

    await waitFor(() => {
      expect(
        component.getByText(createMessage(SAVE_HOTKEY_TOASTER_MESSAGE)),
      ).toBeDefined();
    });
  });
});
