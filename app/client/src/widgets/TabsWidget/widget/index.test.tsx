import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { render, fireEvent } from "test/testUtils";
import Canvas from "pages/Editor/Canvas";
import React from "react";
import { MockPageDSL } from "test/testCommon";

describe("Tabs widget functional cases", () => {
  it("Should render 2 tabs by default", () => {
    const children: any = buildChildren([{ type: "TABS_WIDGET" }]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Canvas dsl={dsl} pageId="" />
      </MockPageDSL>,
    );
    const tab1 = component.queryByText("Tab 1");
    const tab2 = component.queryByText("Tab 2");
    expect(tab1).toBeDefined();
    expect(tab2).toBeDefined();
  });

  it("Should render components inside tabs by default", () => {
    const tab1Children = buildChildren([
      { type: "SWITCH_WIDGET", label: "Tab1 Switch" },
      { type: "CHECKBOX_WIDGET", label: "Tab1 Checkbox" },
    ]);
    const tab2Children = buildChildren([
      { type: "INPUT_WIDGET_V2", text: "Tab2 Text" },
      { type: "BUTTON_WIDGET", label: "Tab2 Button" },
    ]);
    const children: any = buildChildren([{ type: "TABS_WIDGET" }]);
    children[0].children[0].children = tab1Children;
    children[0].children[1].children = tab2Children;
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Canvas dsl={dsl} pageId="" />
      </MockPageDSL>,
    );
    const tab1 = component.queryByText("Tab 1");
    const tab2: any = component.queryByText("Tab 2");
    expect(tab1).toBeDefined();
    expect(tab2).toBeDefined();
    let tab1Switch = component.queryByText("Tab1 Switch");
    let tab1Checkbox = component.queryByText("Tab1 Checkbox");
    let tab2Input = component.queryByText("Tab2 Text");
    let tab2Button = component.queryByText("Tab2 Button");
    expect(tab1Switch).toBeDefined();
    expect(tab1Checkbox).toBeDefined();
    expect(tab2Input).toBeNull();
    expect(tab2Button).toBeNull();
    fireEvent.click(tab2);
    tab1Switch = component.queryByText("Tab1 Switch");
    tab1Checkbox = component.queryByText("Tab1 Checkbox");
    tab2Input = component.queryByText("Tab2 Text");
    tab2Button = component.queryByText("Tab2 Button");
    expect(tab1Switch).toBeNull();
    expect(tab1Checkbox).toBeNull();
    expect(tab2Input).toBeDefined();
    expect(tab2Button).toBeDefined();
  });
});
