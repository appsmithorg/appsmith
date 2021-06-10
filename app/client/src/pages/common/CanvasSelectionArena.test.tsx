import { fireEvent, render } from "test/testUtils";
import Canvas from "pages/Editor/Canvas";
import React from "react";
import {
  buildChildren,
  widgetCanvasFactory,
} from "test/factories/WidgetFactoryUtils";
import { MockPageDSL } from "test/testCommon";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

describe("Canvas selection test cases", () => {
  it("Should select using canvas draw", () => {
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
        <Canvas dsl={dsl} />
      </MockPageDSL>,
    );
    let selectionCanvas: any = component.queryByTestId(
      `canvas-${MAIN_CONTAINER_WIDGET_ID}`,
    );
    expect(selectionCanvas.style.zIndex).toBe("");
    fireEvent.mouseDown(selectionCanvas);

    selectionCanvas = component.queryByTestId(
      `canvas-${MAIN_CONTAINER_WIDGET_ID}`,
    );

    expect(selectionCanvas.style.zIndex).toBe("2");
    fireEvent.mouseUp(selectionCanvas);
    selectionCanvas = component.queryByTestId(
      `canvas-${MAIN_CONTAINER_WIDGET_ID}`,
    );

    expect(selectionCanvas.style.zIndex).toBe("");
  });

  it("Should select all elements using canvas from top to bottom", () => {
    const children: any = buildChildren([
      {
        type: "TABS_WIDGET",
        topRow: 1,
        bottomRow: 3,
        leftColumn: 1,
        rightColumn: 3,
      },
      {
        type: "SWITCH_WIDGET",
        topRow: 1,
        bottomRow: 2,
        leftColumn: 5,
        rightColumn: 13,
      },
    ]);
    const dsl: any = widgetCanvasFactory.build({
      children,
    });
    const component = render(
      <MockPageDSL dsl={dsl}>
        <Canvas dsl={dsl} />
      </MockPageDSL>,
    );
    const selectionCanvas: any = component.queryByTestId(
      `canvas-${MAIN_CONTAINER_WIDGET_ID}`,
    );
    const syntheticEvent = (
      event: MouseEvent,
      offsetX: number,
      offsetY: number,
    ) => {
      Object.defineProperty(event, "offsetLeft", { get: () => 0 });
      Object.defineProperty(event, "offsetTop", { get: () => 0 });
      Object.defineProperty(event, "offsetX", { get: () => offsetX });
      Object.defineProperty(event, "offsetY", { get: () => offsetY });
      return event;
    };
    fireEvent(
      selectionCanvas,
      syntheticEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        }),
        10,
        10,
      ),
    );
    fireEvent(
      selectionCanvas,
      syntheticEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
        }),
        dsl.rightColumn * 4,
        dsl.bottomRow * 4,
      ),
    );

    fireEvent(
      selectionCanvas,
      syntheticEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
        }),
        dsl.rightColumn * 4,
        dsl.bottomRow * 4,
      ),
    );
    const selectedWidgets = component.queryAllByTestId(
      "t--widget-propertypane-toggle",
    );
    expect(selectedWidgets.length).toBe(2);
  });
});
