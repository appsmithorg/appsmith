import React from "react";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import {
  render,
  MockApplication,
  useMockDsl,
  fireEvent,
  dispatchTestKeyboardEventWithCode,
} from "test/testUtils";
import GlobalHotKeys from "./GlobalHotKeys";
import MainContainer from "./MainContainer";
import { MemoryRouter } from "react-router-dom";
import * as utilities from "selectors/editorSelectors";

const mockGetCanvasWidgetDsl = jest.spyOn(utilities, "getCanvasWidgetDsl");
const mockGetIsFetchingPage = jest.spyOn(utilities, "getIsFetchingPage");
function UpdatedMainContaner({ dsl }: any) {
  useMockDsl(dsl);
  return <MainContainer />;
}

it("Cmd + A - select all widgets on canvas", () => {
  const children: any = buildChildren([
    { type: "TABS_WIDGET" },
    { type: "SWITCH_WIDGET" },
  ]);
  const dsl: any = widgetCanvasFactory.build({
    children,
  });
  mockGetCanvasWidgetDsl.mockImplementation(() => dsl);
  mockGetIsFetchingPage.mockImplementation(() => false);

  const component = render(
    <MemoryRouter initialEntries={["/applications/app_id/pages/page_id/edit"]}>
      <MockApplication>
        <GlobalHotKeys>
          <UpdatedMainContaner dsl={dsl} />
        </GlobalHotKeys>
      </MockApplication>
    </MemoryRouter>,
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
  selectedWidgets = component.queryAllByTestId("t--widget-propertypane-toggle");
  expect(selectedWidgets.length).toBe(0);
});
