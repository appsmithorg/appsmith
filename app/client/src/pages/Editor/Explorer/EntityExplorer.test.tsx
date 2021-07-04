import { act, fireEvent, render } from "test/testUtils";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import React from "react";
import { MockPageDSL } from "test/testCommon";
import Sidebar from "components/editorComponents/Sidebar";
import { generateReactKey } from "utils/generators";
jest.useFakeTimers();
describe("Entity Explorer tests", () => {
  it("Should render Widgets tree in entity explorer", () => {
    const children: any = buildChildren([{ type: "TABS_WIDGET" }]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Sidebar />
      </MockPageDSL>,
    );
    const widgetsTree: any = component.queryByText("Widgets");
    act(() => {
      fireEvent.click(widgetsTree);
      jest.runAllTimers();
    });
    const tabsWidget = component.queryByText(children[0].widgetName);
    expect(tabsWidget).toBeTruthy();
  });

  it("Select widget on entity explorer", () => {
    const children: any = buildChildren([{ type: "TABS_WIDGET" }]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Sidebar />
      </MockPageDSL>,
    );
    const widgetsTree: any = component.queryByText("Widgets");
    act(() => {
      fireEvent.click(widgetsTree);
      jest.runAllTimers();
    });
    const tabsWidget: any = component.queryByText(children[0].widgetName);
    act(() => {
      fireEvent.click(tabsWidget);
      jest.runAllTimers();
    });
    const highlighted = component.container.getElementsByClassName(
      "highlighted active",
    );
    expect(highlighted.length).toBe(1);
  });

  it("CMD + click Multi Select widget on entity explorer", () => {
    const children: any = buildChildren([
      { type: "CHECKBOX_WIDGET", parentId: "0" },
      { type: "SWITCH_WIDGET", parentId: "0" },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Sidebar />
      </MockPageDSL>,
    );
    const widgetsTree: any = component.queryByText("Widgets");
    act(() => {
      fireEvent.click(widgetsTree);
      jest.runAllTimers();
    });
    const checkBox: any = component.queryByText(children[0].widgetName);
    act(() => {
      fireEvent.click(checkBox);
      jest.runAllTimers();
    });
    const switchWidget: any = component.queryByText(children[1].widgetName);

    act(() => {
      fireEvent.click(switchWidget, {
        ctrlKey: true,
      });
      jest.runAllTimers();
    });
    const highlighted = component.container.querySelectorAll(
      "div.widget > .highlighted.active",
    );
    const active = component.container.querySelectorAll("div.widget > .active");
    expect(highlighted.length).toBe(1);
    expect(active.length).toBe(2);
  });

  it("Shift + Click Multi Select widget on entity explorer", () => {
    const children: any = buildChildren([
      { type: "CHECKBOX_WIDGET", parentId: "0" },
      { type: "SWITCH_WIDGET", parentId: "0" },
      { type: "BUTTON_WIDGET", parentId: "0" },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Sidebar />
      </MockPageDSL>,
    );
    const widgetsTree: any = component.queryByText("Widgets");
    act(() => {
      fireEvent.click(widgetsTree);
      jest.runAllTimers();
    });
    const buttonWidget: any = component.queryByText(children[2].widgetName);

    act(() => {
      fireEvent.click(buttonWidget, {
        shiftKey: true,
      });
      jest.runAllTimers();
    });
    const highlighted = component.container.querySelectorAll(
      "div.widget > .highlighted.active",
    );
    const active = component.container.querySelectorAll("div.widget > .active");
    expect(highlighted.length).toBe(1);
    expect(active.length).toBe(3);
  });

  it("Shift + Click Deselect Non Siblings", () => {
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
      { type: "CHART_WIDGET" },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children: containerChildren,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Sidebar />
      </MockPageDSL>,
    );
    const widgetsTree: any = component.queryByText("Widgets");
    act(() => {
      fireEvent.click(widgetsTree);
      jest.runAllTimers();
    });
    const containerWidget: any = component.queryByText(
      containerChildren[0].widgetName,
    );

    act(() => {
      fireEvent.click(containerWidget);
      jest.runAllTimers();
    });
    let highlighted = component.container.querySelectorAll(
      "div.widget > .highlighted.active",
    );
    let active = component.container.querySelectorAll("div.widget > .active");
    expect(highlighted.length).toBe(1);
    expect(active.length).toBe(1);
    const collapsible: any = active[0].parentElement?.querySelector(
      ".bp3-icon.bp3-icon-caret-right",
    );
    fireEvent.click(collapsible);
    const buttonWidget: any = component.queryByText(children[2].widgetName);
    act(() => {
      fireEvent.click(buttonWidget, {
        shiftKey: true,
      });
      jest.runAllTimers();
    });
    highlighted = component.container.querySelectorAll(
      "div.widget > .highlighted.active",
    );
    active = component.container.querySelectorAll("div.widget > .active");
    expect(highlighted.length).toBe(1);
    expect(active.length).toBe(1);
    const checkBoxWidget: any = component.queryByText(children[0].widgetName);
    act(() => {
      fireEvent.click(checkBoxWidget, {
        shiftKey: true,
      });
      jest.runAllTimers();
    });
    highlighted = component.container.querySelectorAll(
      "div.widget > .highlighted.active",
    );
    active = component.container.querySelectorAll("div.widget > .active");
    expect(highlighted.length).toBe(1);
    expect(active.length).toBe(3);
    const chartWidget: any = component.queryByText(
      containerChildren[1].widgetName,
    );
    act(() => {
      fireEvent.click(chartWidget, {
        shiftKey: true,
      });
      jest.runAllTimers();
    });
    highlighted = component.container.querySelectorAll(
      "div.widget > .highlighted.active",
    );
    active = component.container.querySelectorAll("div.widget > .active");
    expect(highlighted.length).toBe(1);
    expect(active.length).toBe(1);
  });
});
