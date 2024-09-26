import { RenderModes } from "constants/WidgetConstants";
import * as editorSelectors from "selectors/editorSelectors";
import { buildChildren } from "test/factories/WidgetFactoryUtils";
import { renderAppsmithCanvas } from "./CanvasFactory";
import { render } from "test/testUtils";
import React from "react";
import store from "store";
import type { WidgetProps } from "widgets/BaseWidget";
import { LayoutSystemTypes } from "./types";
import * as layoutSystemSelectors from "selectors/layoutSystemSelectors";

describe("Layout Based Canvas aka Canvas Widget Test cases", () => {
  it("Render Fixed Layout Editor Canvas when layoutSystemType/appPositioningType is FIXED and render mode is CANVAS/PAGE", () => {
    const children = buildChildren([
      {
        type: "CANVAS_WIDGET",
        parentId: "xxxxxx",
        children: [],
        widgetId: "yyyyyy",
        dynamicHeight: "FIXED",
      },
    ]);

    if (children) {
      const canvasProps = children[0];

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const state = store.getState();
      const customState = {
        ...state,
        entities: {
          ...state.entities,
          canvasWidgets: {
            xxxxxx: {} as WidgetProps,
            yyyyyy: {} as WidgetProps,
          },
        },
      };
      const editorCanvas = render(<>{renderAppsmithCanvas(canvasProps)}</>, {
        initialState: customState,
      });
      const editorDropTarget =
        editorCanvas.container.getElementsByClassName("t--drop-target")[0];

      expect(editorDropTarget).toBeTruthy();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      const viewerCanvas = render(<>{renderAppsmithCanvas(canvasProps)}</>, {
        initialState: customState,
      });
      const viewerDropTarget =
        viewerCanvas.container.getElementsByClassName("t--drop-target")[0];

      expect(viewerDropTarget).toBeFalsy();
    }
  });
  it("Render Auto Layout Editor Canvas when layoutSystemType/appPositioningType is AUTO and render mode is CANVAS/PAGE", () => {
    const children = buildChildren([
      {
        type: "CANVAS_WIDGET",
        parentId: "xxxxxx",
        children: [],
        widgetId: "yyyyyy",
        dynamicHeight: "FIXED",
      },
    ]);

    if (children) {
      const canvasProps = children[0];

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.AUTO);
      const state = store.getState();
      const customState = {
        ...state,
        entities: {
          ...state.entities,
          canvasWidgets: {
            xxxxxx: {} as WidgetProps,
            yyyyyy: {} as WidgetProps,
          },
        },
      };
      const editorCanvas = render(<>{renderAppsmithCanvas(canvasProps)}</>, {
        initialState: customState,
      });
      const editorDropTarget =
        editorCanvas.container.getElementsByClassName("t--drop-target")[0];

      expect(editorDropTarget).toBeTruthy();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      const viewerCanvas = render(<>{renderAppsmithCanvas(canvasProps)}</>, {
        initialState: customState,
      });
      const viewerDropTarget =
        viewerCanvas.container.getElementsByClassName("t--drop-target")[0];

      expect(viewerDropTarget).toBeFalsy();
    }
  });
});
