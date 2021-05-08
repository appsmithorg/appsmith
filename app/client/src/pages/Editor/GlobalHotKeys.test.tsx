import AppComments from "comments/AppComments/AppComments";
import React from "react";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import {
  render,
  MockPageDSL,
  MockApplication,
  useMockDsl,
} from "test/testUtils";
import GlobalHotKeys from "./GlobalHotKeys";
import EditorLoader from "./loader";
import MainContainer from "./MainContainer";
import { MemoryRouter } from "react-router-dom";
import createMockStore from "redux-mock-store";
import { createStore } from "redux";
import appReducer from "reducers";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import WidgetFactory from "utils/WidgetFactory";

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
  const component = render(
    <MemoryRouter initialEntries={["/applications/app_id/pages/page_id/edit"]}>
      <MockApplication>
        <GlobalHotKeys>
          <UpdatedMainContaner dsl={dsl} />
        </GlobalHotKeys>
      </MockApplication>
    </MemoryRouter>,
  );
  console.log(component.container.innerHTML);
});
