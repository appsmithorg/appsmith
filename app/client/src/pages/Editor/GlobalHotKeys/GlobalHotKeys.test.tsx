import React from "react";
import { Slide } from "react-toastify";

import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { act, render, fireEvent, waitFor } from "test/testUtils";
import GlobalHotKeys from "./GlobalHotKeys";
import MainContainer from "../MainContainer";
import { MemoryRouter } from "react-router-dom";
import * as utilities from "selectors/editorSelectors";
import store from "store";
import { sagasToRunForTests } from "test/sagas";
import { all } from "@redux-saga/core/effects";
import {
  dispatchTestKeyboardEventWithCode,
  MockApplication,
  mockGetCanvasWidgetDsl,
  MockPageDSL,
  useMockDsl,
} from "test/testCommon";
import { MockCanvas } from "test/testMockedWidgets";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { generateReactKey } from "utils/generators";
import { redoAction, undoAction } from "actions/pageActions";
import { StyledToastContainer } from "components/ads/Toast";
import {
  createMessage,
  SAVE_HOTKEY_TOASTER_MESSAGE,
} from "@appsmith/constants/messages";

jest.mock("constants/routes", () => {
  return {
    ...jest.requireActual("constants/routes"),
    matchBuilderPath: () => true,
  };
});

describe("Canvas Hot Keys", () => {
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
    it("Cmd + A - select all widgets on canvas", async () => {
      const children: any = buildChildren([
        { type: "TABS_WIDGET", parentId: MAIN_CONTAINER_WIDGET_ID },
        { type: "SWITCH_WIDGET", parentId: MAIN_CONTAINER_WIDGET_ID },
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
              <UpdatedMainContainer dsl={dsl} />
            </GlobalHotKeys>
          </MockApplication>
        </MemoryRouter>,
        { initialState: store.getState(), sagasToRun: sagasToRunForTests },
      );
      let propPane = component.queryByTestId("t--propertypane");
      expect(propPane).toBeNull();
      const canvasWidgets = component.queryAllByTestId("test-widget");
      expect(canvasWidgets.length).toBe(2);
      act(() => {
        if (canvasWidgets[0].firstChild) {
          fireEvent.mouseOver(canvasWidgets[0].firstChild);
          fireEvent.click(canvasWidgets[0].firstChild);
        }
      });
      const tabsWidgetName: any = component.container.querySelector(
        `span.t--widget-name`,
      );
      fireEvent.click(tabsWidgetName);
      propPane = component.queryByTestId("t--propertypane");
      expect(propPane).not.toBeNull();

      const artBoard: any = component.queryByTestId("t--canvas-artboard");
      // deselect all other widgets
      fireEvent.click(artBoard);

      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "A",
        65,
        false,
        true,
      );
      let selectedWidgets = component.queryAllByTestId("t--selected");
      expect(selectedWidgets.length).toBe(2);
      dispatchTestKeyboardEventWithCode(
        component.container,
        "keydown",
        "escape",
        27,
        false,
        false,
      );
      selectedWidgets = component.queryAllByTestId("t--selected");
      expect(selectedWidgets.length).toBe(0);
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

      selectedWidgets = component.queryAllByTestId("t--selected");
      expect(selectedWidgets.length).toBe(2);
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
      selectedWidgets = component.queryAllByTestId("t--selected");
      expect(selectedWidgets.length).toBe(2);
    });
    it("Cmd + A - select all widgets inside last selected container", async () => {
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
              <UpdatedMainContainer dsl={dsl} />
            </GlobalHotKeys>
          </MockApplication>
        </MemoryRouter>,
        { initialState: store.getState(), sagasToRun: sagasToRunForTests },
      );
      const propPane = component.queryByTestId("t--propertypane");
      expect(propPane).toBeNull();
      const canvasWidgets = component.queryAllByTestId("test-widget");
      expect(canvasWidgets.length).toBe(5);
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
      expect(selectedWidgets.length).toBe(children.length);
    });
    it("Cmd + A - select all widgets inside a form", async () => {
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
              <UpdatedMainContainer dsl={dsl} />
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
    it("Cmd + A - select all widgets inside a list", async () => {
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
              <UpdatedMainContainer dsl={dsl} />
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

    let selectedWidgets = await component.queryAllByTestId("t--selected");
    expect(selectedWidgets.length).toBe(2);
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
    await component.findByTestId("t--selection-box");

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

    selectedWidgets = await component.queryAllByTestId("t--selected");
    expect(selectedWidgets.length).toBe(4);
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

    let selectedWidgets = await component.queryAllByTestId("t--selected");
    expect(selectedWidgets.length).toBe(2);
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
    await component.findByTestId("canvas-selection-0");
    selectedWidgets = await component.queryAllByTestId("t--selected");
    //adding extra time to let cut cmd works
    jest.useFakeTimers();
    setTimeout(() => {
      expect(selectedWidgets.length).toBe(0);
    }, 500);
    jest.runAllTimers();
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
    await component.findByTestId("t--selection-box");
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

    selectedWidgets = await component.queryAllByTestId("t--selected");
    expect(selectedWidgets.length).toBe(2);
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
