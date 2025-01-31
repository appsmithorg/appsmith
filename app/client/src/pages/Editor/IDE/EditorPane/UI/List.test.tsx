import { act, fireEvent, render } from "test/testUtils";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import React from "react";
import { MockPageDSL } from "test/testCommon";
import { DEFAULT_ENTITY_EXPLORER_WIDTH } from "constants/AppConstants";
import { runSagaMiddleware } from "store";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import * as explorerSelector from "selectors/explorerSelector";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import * as widgetSelectionsActions from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { NavigationMethod } from "utils/history";
import ListWidgets from "./List";

jest.useFakeTimers();
const pushState = jest.spyOn(window.history, "pushState");

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
pushState.mockImplementation((state: any, title: any, url: any) => {
  window.document.title = title;
  window.location.pathname = url;
});

jest.mock("ee/utils/permissionHelpers", () => {
  return {
    __esModule: true,
    ...jest.requireActual("ee/utils/permissionHelpers"),
  };
});

jest.mock("ee/pages/Editor/Explorer/helpers", () => ({
  __esModule: true,
  ...jest.requireActual("ee/pages/Editor/Explorer/helpers"),
}));

jest.mock("ee/utils/BusinessFeatures/permissionPageHelpers", () => ({
  __esModule: true,
  ...jest.requireActual("ee/utils/BusinessFeatures/permissionPageHelpers"),
}));

jest.mock("selectors/explorerSelector", () => ({
  __esModule: true,
  ...jest.requireActual("selectors/explorerSelector"),
}));

jest
  .spyOn(explorerSelector, "getExplorerWidth")
  .mockImplementation(() => DEFAULT_ENTITY_EXPLORER_WIDTH);

const setFocusSearchInput = jest.fn();

describe("Widget List in Explorer tests", () => {
  beforeAll(() => {
    runSagaMiddleware();
  });

  beforeEach(() => {
    urlBuilder.updateURLParams(
      {
        baseApplicationId: "appId",
        applicationSlug: "appSlug",
        applicationVersion: 2,
      },
      [
        {
          basePageId: "pageId",
          pageSlug: "pageSlug",
        },
      ],
    );
  });

  it("Should render Widgets tree in entity explorer", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any = buildChildren([{ type: "TABS_WIDGET" }]);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <ListWidgets setFocusSearchInput={setFocusSearchInput} />
      </MockPageDSL>,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widgetsTree: Element = await component.findByText(
      children[0].widgetName,
      {
        selector: "div.t--entity-name",
      },
      { timeout: 3000 },
    );

    act(() => {
      fireEvent.click(widgetsTree);
      jest.runAllTimers();
    });
    const tabsWidget = component.queryByText(children[0].widgetName);

    expect(tabsWidget).toBeTruthy();
  });

  describe("Widget Selection in entity explorer", () => {
    const spyWidgetSelection = jest.spyOn(
      widgetSelectionsActions,
      "selectWidgetInitAction",
    );

    beforeEach(() => {
      spyWidgetSelection.mockClear();
    });

    it("Select widget on entity explorer", async () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any = buildChildren([
        { type: "TABS_WIDGET", widgetId: "tabsWidgetId" },
      ]);
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dsl: any = widgetCanvasFactory.build({
        children,
      });
      const component = render(
        <MockPageDSL dsl={dsl}>
          <ListWidgets setFocusSearchInput={setFocusSearchInput} />
        </MockPageDSL>,
      );
      // TODO: Fix this the next time the file is edited
      const tabsWidget: Element = await component.findByText(
        children[0].widgetName,
        undefined,
        { timeout: 3000 },
      );

      act(() => {
        fireEvent.click(tabsWidget);
        jest.runAllTimers();
      });

      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.One,
        ["tabsWidgetId"],
        NavigationMethod.EntityExplorer,
        undefined,
      );
    });

    it("CMD + click Multi Select widget on entity explorer", async () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any = buildChildren([
        {
          type: "CHECKBOX_WIDGET",
          parentId: "0",
          widgetId: "checkboxWidgetId",
        },
        { type: "SWITCH_WIDGET", parentId: "0", widgetId: "switchWidgetId" },
      ]);
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dsl: any = widgetCanvasFactory.build({
        children,
      });
      const component = render(
        <MockPageDSL dsl={dsl}>
          <ListWidgets setFocusSearchInput={setFocusSearchInput} />
        </MockPageDSL>,
      );
      // TODO: Fix this the next time the file is edited
      const checkBox: Element = await component.findByText(
        children[0].widgetName,
        undefined,
        { timeout: 3000 },
      );

      act(() => {
        fireEvent.click(checkBox);
        jest.runAllTimers();
      });
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const switchWidget: any = component.queryByText(children[1].widgetName);

      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.One,
        ["checkboxWidgetId"],
        NavigationMethod.EntityExplorer,
        undefined,
      );

      act(() => {
        fireEvent.click(switchWidget, {
          ctrlKey: true,
        });
        jest.runAllTimers();
      });
      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.PushPop,
        ["switchWidgetId"],
        undefined,
        undefined,
      );
    });

    it("Shift + Click Multi Select widget on entity explorer", async () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any = buildChildren([
        {
          type: "CHECKBOX_WIDGET",
          parentId: "0",
          widgetId: "checkboxWidgetId",
        },
        { type: "SWITCH_WIDGET", parentId: "0", widgetId: "switchWidgetId" },
        { type: "BUTTON_WIDGET", parentId: "0", widgetId: "buttonWidgetId" },
      ]);
      // TODO: Fix this the next time the file is edited
      const dsl = widgetCanvasFactory.build({
        children,
      });
      const component = render(
        <MockPageDSL dsl={dsl}>
          <ListWidgets setFocusSearchInput={setFocusSearchInput} />
        </MockPageDSL>,
      );

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkboxWidget: any = await component.findByText(
        children[0].widgetName,
        undefined,
        { timeout: 3000 },
      );
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buttonWidget: any = component.queryByText(children[2].widgetName);

      act(() => {
        fireEvent.click(checkboxWidget);
        jest.runAllTimers();
      });

      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.One,
        ["checkboxWidgetId"],
        NavigationMethod.EntityExplorer,
        undefined,
      );

      act(() => {
        fireEvent.click(buttonWidget, {
          shiftKey: true,
        });
        jest.runAllTimers();
      });

      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.ShiftSelect,
        ["buttonWidgetId"],
        undefined,
        undefined,
      );
    });

    it("Shift + Click Deselect Non Siblings", async () => {
      const containerId = "containerWidgetId";
      const canvasId = "canvasWidgetId";
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any = buildChildren([
        {
          type: "CHECKBOX_WIDGET",
          parentId: canvasId,
          widgetId: "checkboxWidgetId",
        },
        {
          type: "SWITCH_WIDGET",
          parentId: canvasId,
          widgetId: "switchWidgetId",
        },
        {
          type: "BUTTON_WIDGET",
          parentId: canvasId,
          widgetId: "buttonWidgetId",
        },
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
          parentId: MAIN_CONTAINER_WIDGET_ID,
        },
        {
          type: "CHART_WIDGET",
          parentId: MAIN_CONTAINER_WIDGET_ID,
          widgetId: "chartWidgetId",
        },
      ]);
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dsl: any = widgetCanvasFactory.build({
        children: containerChildren,
      });
      const component = render(
        <MockPageDSL dsl={dsl}>
          <ListWidgets setFocusSearchInput={setFocusSearchInput} />
        </MockPageDSL>,
      );
      // TODO: Fix this the next time the file is edited
      const containerWidget: Element = await component.findByText(
        containerChildren[0].widgetName,
        undefined,
        { timeout: 3000 },
      );

      act(() => {
        fireEvent.click(containerWidget);
        jest.runAllTimers();
      });

      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.One,
        [containerId],
        NavigationMethod.EntityExplorer,
        undefined,
      );

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collapsible: any = component.container.querySelector(
        `.t--entity-collapse-toggle[id="arrow-right-s-line"]`,
      );

      fireEvent.click(collapsible);

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buttonWidget: any = component.queryByText(children[2].widgetName);

      act(() => {
        fireEvent.click(buttonWidget, {
          shiftKey: true,
        });
        jest.runAllTimers();
      });

      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.ShiftSelect,
        ["buttonWidgetId"],
        undefined,
        undefined,
      );

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkBoxWidget: any = component.queryByText(children[0].widgetName);

      act(() => {
        fireEvent.click(checkBoxWidget, {
          shiftKey: true,
        });
        jest.runAllTimers();
      });
      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.ShiftSelect,
        ["checkboxWidgetId"],
        undefined,
        undefined,
      );
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chartWidget: any = component.queryByText(
        containerChildren[1].widgetName,
      );

      act(() => {
        fireEvent.click(chartWidget, {
          shiftKey: true,
        });
        jest.runAllTimers();
      });
      expect(spyWidgetSelection).toHaveBeenCalledWith(
        SelectionRequestType.ShiftSelect,
        ["chartWidgetId"],
        undefined,
        undefined,
      );
    });
  });
});
