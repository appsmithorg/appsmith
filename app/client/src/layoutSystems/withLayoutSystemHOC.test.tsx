import { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { LayoutSystemTypes } from "reducers/entityReducers/pageListReducer";
import * as editorSelectors from "selectors/editorSelectors";
import { WidgetTypeFactories } from "test/factories/Widgets/WidgetTypeFactories";
import { render } from "test/testUtils";
import CanvasWidget from "widgets/CanvasWidget";
import InputWidget from "widgets/InputWidgetV2/widget";
import { ModalWidget } from "widgets/ModalWidget/widget";
import { withLayoutSystemHOC } from "./withLayoutSystemHOC";

describe("Layout System HOC's Tests", () => {
  describe("Fixed Layout Layers", () => {
    it("Layout system hoc should return Fixed Editor for FIXED positioing and CANVAS render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const component = render(<HOC {...widgetProps} />);
      const positionedLayer =
        component.container.getElementsByClassName("positioned-widget")[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      expect(positionedLayer).toBeTruthy();
      expect(resizerLayer).toBeTruthy();
    });
    it("Layout system hoc should return Fixed Modal Editor for FIXED positioing and CANVAS render mode", () => {
      const widget = ModalWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
      });
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const component = render(<HOC {...widgetProps} />);
      const positionedLayer =
        component.container.getElementsByClassName("positioned-widget")[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      const overlayLayer =
        component.container.getElementsByClassName("bp3-overlay")[0];
      expect(positionedLayer).toBeFalsy();
      expect(overlayLayer).toBeTruthy();
      expect(resizerLayer).toBeTruthy();
    });
    it("Layout system hoc should return no wrapper for CANVAS WIDGET for FIXED positioing and CANVAS render mode", () => {
      const widget = CanvasWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[CanvasWidget.type].build();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const component = render(<HOC {...widgetProps} />);
      const positionedLayer =
        component.container.getElementsByClassName("positioned-widget")[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      expect(positionedLayer).toBeFalsy();
      expect(resizerLayer).toBeFalsy();
    });
    it("Layout system hoc should return Fixed Modal Viewer for FIXED positioing and PAGE render mode", () => {
      const widget = ModalWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
      });
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const component = render(<HOC {...widgetProps} />);
      const positionedLayer =
        component.container.getElementsByClassName("positioned-widget")[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      const overlayLayer =
        component.container.getElementsByClassName("bp3-overlay")[0];
      expect(positionedLayer).toBeFalsy();
      expect(overlayLayer).toBeTruthy();
      expect(resizerLayer).toBeFalsy();
    });
    it("Layout system hoc should return Fixed Viewer for FIXED positioing and PAGE render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const component = render(<HOC {...widgetProps} />);
      const positionedLayer =
        component.container.getElementsByClassName("positioned-widget")[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      expect(positionedLayer).toBeTruthy();
      expect(resizerLayer).toBeFalsy();
    });

    it("Layout system hoc should return no wrapper for CANVAS WIDGET for FIXED positioing and PAGE render mode", () => {
      const widget = CanvasWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[CanvasWidget.type].build();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const component = render(<HOC {...widgetProps} />);
      const positionedLayer =
        component.container.getElementsByClassName("positioned-widget")[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      expect(positionedLayer).toBeFalsy();
      expect(resizerLayer).toBeFalsy();
    });
  });
  describe("Auto Layout Layers", () => {
    it("Layout system hoc should return Auto Layout Editor for AUTO positioing and CANVAS render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.AUTO);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "auto-layout-child-" + widgetProps.widgetId,
      )[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      expect(flexPositionedLayer).toBeTruthy();
      expect(resizerLayer).toBeTruthy();
    });
    it("Layout system hoc should return Auto Modal Editor for AUTO positioing and CANVAS render mode", () => {
      const widget = ModalWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
      });
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.AUTO);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "auto-layout-child-" + widgetProps.widgetId,
      )[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      const overlayLayer =
        component.container.getElementsByClassName("bp3-overlay")[0];
      expect(flexPositionedLayer).toBeFalsy();
      expect(overlayLayer).toBeTruthy();
      expect(resizerLayer).toBeTruthy();
    });
    it("Layout system hoc should return no wrapper for CANVAS WIDGET for AUTO positioing and CANVAS render mode", () => {
      const widget = CanvasWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[CanvasWidget.type].build();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.AUTO);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "auto-layout-child-" + widgetProps.widgetId,
      )[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      expect(flexPositionedLayer).toBeFalsy();
      expect(resizerLayer).toBeFalsy();
    });
    it("Layout system hoc should return Auto Modal Viewer for AUTO positioing and PAGE render mode", () => {
      const widget = ModalWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
      });
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.AUTO);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "auto-layout-child-" + widgetProps.widgetId,
      )[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      const overlayLayer =
        component.container.getElementsByClassName("bp3-overlay")[0];
      expect(flexPositionedLayer).toBeFalsy();
      expect(overlayLayer).toBeTruthy();
      expect(resizerLayer).toBeFalsy();
    });
    it("Layout system hoc should return Auto Viewer for Auto positioing and PAGE render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.AUTO);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "auto-layout-child-" + widgetProps.widgetId,
      )[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      expect(flexPositionedLayer).toBeTruthy();
      expect(resizerLayer).toBeFalsy();
    });

    it("Layout system hoc should return no wrapper for CANVAS WIDGET for Auto positioing and PAGE render mode", () => {
      const widget = CanvasWidget;
      const HOC = withLayoutSystemHOC(widget);
      const widgetProps = WidgetTypeFactories[CanvasWidget.type].build();
      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(editorSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.AUTO);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "auto-layout-child-" + widgetProps.widgetId,
      )[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];
      expect(flexPositionedLayer).toBeFalsy();
      expect(resizerLayer).toBeFalsy();
    });
  });
});
