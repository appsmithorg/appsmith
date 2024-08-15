import React from "react";

import {
  createMessage,
  SAVE_HOTKEY_TOASTER_MESSAGE,
} from "ee/constants/messages";
import { all } from "@redux-saga/core/effects";
import { redoAction, undoAction } from "actions/pageActions";
import { Toast } from "@appsmith/ads";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
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
  mockGetWidgetEvalValues,
  MockPageDSL,
  useMockDsl,
} from "test/testCommon";
import { MockCanvas } from "test/testMockedWidgets";
import { act, fireEvent, render, waitFor } from "test/testUtils";
import * as widgetRenderUtils from "utils/widgetRenderUtils";
import IDE from "../IDE";
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
  const pageId = "0123456789abcdef00000000";
  beforeAll(() => {
    runSagaMiddleware();
  });

  const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function UpdatedEditor({ dsl }: any) {
    useMockDsl(dsl);
    return <IDE />;
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
    jest.mock("ee/sagas/PageSagas", () => ({
      ...jest.requireActual("ee/sagas/PageSagas"),
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
      .spyOn(utilities, "computeMainContainerWidget") // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((widget) => widget as any);

    it("Cmd + A - select all widgets on canvas", async () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dsl: any = widgetCanvasFactory.build({
        children,
      });
      mockGetIsFetchingPage.mockImplementation(() => false);
      const spyWidgetSelection = jest.spyOn(
        widgetSelectionsActions,
        "selectWidgetInitAction",
      );

      const spyPaste = jest.spyOn(widgetActions, "pasteWidget");

      const component = render(
        <MemoryRouter
          initialEntries={[`/app/applicationSlug/pageSlug-${pageId}/edit`]}
        >
          <MockApplication>
            <GlobalHotKeys
              getMousePosition={() => {
                return { x: 0, y: 0 };
              }}
              toggleDebugger={() => {}}
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
          toggleDebugger={() => {}}
        >
          <MockCanvas />
        </GlobalHotKeys>
      </MockPageDSL>,
      { initialState: store.getState(), sagasToRun: sagasToRunForTests },
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artBoard: any = component.queryByTestId("t--canvas-artboard");
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
          toggleDebugger={() => {}}
        >
          <MockCanvas />
        </GlobalHotKeys>
      </MockPageDSL>,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artBoard: any = component.queryByTestId("t--canvas-artboard");
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
          toggleDebugger={() => {}}
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
          toggleDebugger={() => {}}
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
          toggleDebugger={() => {}}
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
        <Toast />
        <GlobalHotKeys
          getMousePosition={() => {
            return { x: 0, y: 0 };
          }}
          toggleDebugger={() => {}}
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
