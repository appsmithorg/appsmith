import { act, fireEvent, render } from "test/testUtils";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import React from "react";
import { MockPageDSL } from "test/testCommon";
import Sidebar from "components/editorComponents/Sidebar";
import { DEFAULT_ENTITY_EXPLORER_WIDTH } from "constants/AppConstants";
import store, { runSagaMiddleware } from "store";
import Datasources from "./Datasources";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { mockDatasources } from "./mockTestData";
import { updateCurrentPage } from "actions/pageActions";
import urlBuilder from "entities/URLRedirect/URLAssembly";
import * as helpers from "@appsmith/pages/Editor/Explorer/helpers";
import * as permissionUtils from "@appsmith/utils/permissionHelpers";
import userEvent from "@testing-library/user-event";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import * as widgetSelectionsActions from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { NavigationMethod } from "utils/history";

jest.useFakeTimers();
const pushState = jest.spyOn(window.history, "pushState");
pushState.mockImplementation((state: any, title: any, url: any) => {
  window.document.title = title;
  window.location.pathname = url;
});

jest.mock("@appsmith/utils/permissionHelpers", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@appsmith/utils/permissionHelpers"),
  };
});

jest.mock("@appsmith/pages/Editor/Explorer/helpers", () => ({
  __esModule: true,
  ...jest.requireActual("@appsmith/pages/Editor/Explorer/helpers"),
}));

describe("Entity Explorer tests", () => {
  beforeAll(() => {
    runSagaMiddleware();
  });

  beforeEach(() => {
    urlBuilder.updateURLParams(
      {
        applicationId: "appId",
        applicationSlug: "appSlug",
        applicationVersion: 2,
      },
      [
        {
          pageId: "pageId",
          pageSlug: "pageSlug",
        },
      ],
    );
  });

  it("checks datasources section in explorer", () => {
    const mockExplorerState = jest.spyOn(helpers, "getExplorerStatus");
    mockExplorerState.mockImplementationOnce(() => true);
    store.dispatch({
      type: ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      payload: mockDatasources,
    });
    jest
      .spyOn(permissionUtils, "hasCreateDatasourcePermission")
      .mockReturnValue(true);
    store.dispatch(updateCurrentPage("pageId"));
    const component = render(<Datasources />);
    expect(component.container.getElementsByClassName("t--entity").length).toBe(
      5,
    );
  });
  it("should hide create datasources section in explorer if the user don't have valid permissions", () => {
    store.dispatch({
      type: ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      payload: mockDatasources,
    });
    jest
      .spyOn(permissionUtils, "hasCreateDatasourcePermission")
      .mockReturnValue(false);
    const mockExplorerState = jest.spyOn(helpers, "getExplorerStatus");
    mockExplorerState.mockImplementationOnce(() => true);
    store.dispatch(updateCurrentPage("pageId"));
    const component = render(<Datasources />);
    expect(component.container.getElementsByClassName("t--entity").length).toBe(
      4,
    );
    const addDatasourceEntity = document.getElementById(
      "entity-add_new_datasource",
    );
    expect(addDatasourceEntity).toBeNull();
  });
  it("should hide delete & edit of datasource if the user don't have valid permissions", async () => {
    store.dispatch({
      type: ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      payload: mockDatasources,
    });
    jest
      .spyOn(permissionUtils, "hasCreateDatasourcePermission")
      .mockReturnValue(true);
    jest
      .spyOn(permissionUtils, "hasManageDatasourcePermission")
      .mockReturnValue(false);
    jest
      .spyOn(permissionUtils, "hasDeleteDatasourcePermission")
      .mockReturnValue(false);
    const mockExplorerState = jest.spyOn(helpers, "getExplorerStatus");
    mockExplorerState.mockImplementationOnce(() => true);
    store.dispatch(updateCurrentPage("pageId"));
    const { container } = render(<Datasources />);
    const target = container.getElementsByClassName("t--context-menu");
    await userEvent.click(target[2]);
    const deleteOption = document.getElementsByClassName(
      "t--datasource-delete",
    );
    const editOption = document.getElementsByClassName("t--datasource-rename");
    const refreshOption = document.getElementsByClassName(
      "t--datasource-refresh",
    );
    expect(deleteOption.length).toBe(0);
    expect(editOption.length).toBe(0);
    expect(refreshOption.length).toBe(1);
  });
  it("Should render Widgets tree in entity explorer", () => {
    const children: any = buildChildren([{ type: "TABS_WIDGET" }]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Sidebar width={DEFAULT_ENTITY_EXPLORER_WIDTH} />
      </MockPageDSL>,
    );
    const widgetsTree: any = component.queryByText("Widgets", {
      selector: "div.t--entity-name",
    });
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

    it("Select widget on entity explorer", () => {
      const children: any = buildChildren([
        { type: "TABS_WIDGET", widgetId: "tabsWidgetId" },
      ]);
      const dsl: any = widgetCanvasFactory.build({
        children,
      });
      const component = render(
        <MockPageDSL dsl={dsl}>
          <Sidebar width={DEFAULT_ENTITY_EXPLORER_WIDTH} />
        </MockPageDSL>,
      );
      const tabsWidget: any = component.queryByText(children[0].widgetName);
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

    it("CMD + click Multi Select widget on entity explorer", () => {
      const children: any = buildChildren([
        {
          type: "CHECKBOX_WIDGET",
          parentId: "0",
          widgetId: "checkboxWidgetId",
        },
        { type: "SWITCH_WIDGET", parentId: "0", widgetId: "switchWidgetId" },
      ]);
      const dsl: any = widgetCanvasFactory.build({
        children,
      });
      const component = render(
        <MockPageDSL dsl={dsl}>
          <Sidebar width={DEFAULT_ENTITY_EXPLORER_WIDTH} />
        </MockPageDSL>,
      );
      const checkBox: any = component.queryByText(children[0].widgetName);
      act(() => {
        fireEvent.click(checkBox);
        jest.runAllTimers();
      });
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

    it("Shift + Click Multi Select widget on entity explorer", () => {
      const children: any = buildChildren([
        {
          type: "CHECKBOX_WIDGET",
          parentId: "0",
          widgetId: "checkboxWidgetId",
        },
        { type: "SWITCH_WIDGET", parentId: "0", widgetId: "switchWidgetId" },
        { type: "BUTTON_WIDGET", parentId: "0", widgetId: "buttonWidgetId" },
      ]);
      const dsl: any = widgetCanvasFactory.build({
        children,
      });
      const component = render(
        <MockPageDSL dsl={dsl}>
          <Sidebar width={DEFAULT_ENTITY_EXPLORER_WIDTH} />
        </MockPageDSL>,
      );

      const checkboxWidget: any = component.queryByText(children[0].widgetName);
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

    it("Shift + Click Deselect Non Siblings", () => {
      const containerId = "containerWidgetId";
      const canvasId = "canvasWidgetId";
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
      const dsl: any = widgetCanvasFactory.build({
        children: containerChildren,
      });
      const component = render(
        <MockPageDSL dsl={dsl}>
          <Sidebar width={DEFAULT_ENTITY_EXPLORER_WIDTH} />
        </MockPageDSL>,
      );
      const containerWidget: any = component.queryByText(
        containerChildren[0].widgetName,
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

      const collapsible: any = component.container.querySelector(
        `a.t--entity-collapse-toggle[name="arrow-right"]`,
      );

      fireEvent.click(collapsible);

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
