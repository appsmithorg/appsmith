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
  dispatchTestKeyboardEventWithCode,
  MockApplication,
  mockGetCanvasWidgetDsl,
  MockPageDSL,
  useMockDsl,
} from "test/testCommon";
import { MockCanvas } from "test/testMockedWidgets";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
describe("Select all hotkey", () => {
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

  it("Cmd + A - select all widgets on canvas", () => {
    const children: any = buildChildren([
      { type: "TABS_WIDGET" },
      { type: "SWITCH_WIDGET" },
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
    let propPane = component.queryByTestId("t--propertypane");
    expect(propPane).toBeNull();
    const canvasWidgets = component.queryAllByTestId("test-widget");
    expect(canvasWidgets.length).toBe(2);
    if (canvasWidgets[1].firstChild) {
      fireEvent.mouseOver(canvasWidgets[1].firstChild);
      fireEvent.click(canvasWidgets[1].firstChild);
    }
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
    let selectedWidgets = component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
    expect(selectedWidgets.length).toBe(2);
    dispatchTestKeyboardEventWithCode(
      component.container,
      "keydown",
      "escape",
      27,
      false,
      false,
    );
    selectedWidgets = component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
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

    selectedWidgets = component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
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
    selectedWidgets = component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
    expect(selectedWidgets.length).toBe(2);
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
    const component = render(
      <MockPageDSL dsl={dsl}>
        <GlobalHotKeys>
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

    let selectedWidgets = await component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
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
    await component.findByText(children[0].widgetName + "Copy");
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

    selectedWidgets = await component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
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
        <GlobalHotKeys>
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

    let selectedWidgets = await component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
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
    await component.findByTestId("canvas-0");
    selectedWidgets = await component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
    expect(selectedWidgets.length).toBe(0);
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
    await component.findByText(children[0].widgetName);
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

    selectedWidgets = await component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
    expect(selectedWidgets.length).toBe(2);
  });
});
