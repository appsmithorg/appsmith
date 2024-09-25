import { RenderModes } from "constants/WidgetConstants";
import React from "react";
import * as editorSelectors from "selectors/editorSelectors";
import { WidgetTypeFactories } from "test/factories/Widgets/WidgetTypeFactories";
import { render } from "test/testUtils";
import InputWidget from "widgets/InputWidgetV2";
import { ModalWidget } from "widgets/ModalWidget/widget";
import { WDSModalWidget } from "modules/ui-builder/ui/wds//WDSModalWidget/widget";
import { withLayoutSystemWidgetHOC } from "./withLayoutSystemWidgetHOC";
import { LayoutSystemTypes } from "./types";
import * as layoutSystemSelectors from "selectors/layoutSystemSelectors";

describe("Layout System HOC's Tests", () => {
  describe("Fixed Layout Layers", () => {
    it("Layout system hoc should return Fixed Editor for FIXED positioning and CANVAS render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const component = render(<HOC {...widgetProps} />);
      const positionedLayer =
        component.container.getElementsByClassName("positioned-widget")[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];

      expect(positionedLayer).toBeTruthy();
      expect(resizerLayer).toBeTruthy();
    });
    it("Layout system hoc should return Fixed Modal Editor for FIXED positioning and CANVAS render mode", () => {
      const widget = ModalWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
      });

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
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
    it("Layout system hoc should return Fixed Modal Viewer for FIXED positioning and PAGE render mode", () => {
      const widget = ModalWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
      });

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
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
    it("Layout system hoc should return Fixed Viewer for FIXED positioning and PAGE render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.FIXED);
      const component = render(<HOC {...widgetProps} />);
      const positionedLayer =
        component.container.getElementsByClassName("positioned-widget")[0];
      const resizerLayer =
        component.container.getElementsByClassName("resize-wrapper")[0];

      expect(positionedLayer).toBeTruthy();
      expect(resizerLayer).toBeFalsy();
    });
  });
  describe("Auto Layout Layers", () => {
    it("Layout system hoc should return Auto Layout Editor for AUTO positioning and CANVAS render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
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
    it("Layout system hoc should return Auto Modal Editor for AUTO positioning and CANVAS render mode", () => {
      const widget = ModalWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
      });

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
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
    it("Layout system hoc should return Auto Modal Viewer for AUTO positioning and PAGE render mode", () => {
      const widget = ModalWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
      });

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
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
    it("Layout system hoc should return Auto Viewer for Auto positioning and PAGE render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
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
  });
  describe("Anvil Layout Layers", () => {
    it("Layout system hoc should return Anvil Editor for ANVIL positioning and CANVAS render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.ANVIL);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "anvil-layout-child-" + widgetProps.widgetId,
      )[0];

      expect(flexPositionedLayer).toBeTruthy();
    });
    it("should return Auto Modal Editor for ANVIL positioning and CANVAS render mode", () => {
      const widget = WDSModalWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
        detachFromLayout: true,
        renderMode: RenderModes.CANVAS,
        layout: [
          {
            layoutId: "modalLayoutId",
          },
        ],
      });

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.CANVAS);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.ANVIL);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "anvil-layout-child-" + widgetProps.widgetId,
      )[0];

      expect(flexPositionedLayer).toBeFalsy();
    });
    it("should return Auto Modal Viewer for ANVIL positioning and PAGE render mode", () => {
      const widget = WDSModalWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[ModalWidget.type].build({
        isVisible: true,
        detachFromLayout: true,
        renderMode: RenderModes.PAGE,
      });

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.ANVIL);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer = component.container.getElementsByClassName(
        "anvil-layout-child-" + widgetProps.widgetId,
      )[0];

      expect(flexPositionedLayer).toBeFalsy();
    });
    it("should return Anvil Viewer for ANVIL positioning and PAGE render mode", () => {
      const widget = InputWidget;
      const HOC = withLayoutSystemWidgetHOC(widget);
      const widgetProps = WidgetTypeFactories[InputWidget.type].build();

      jest
        .spyOn(editorSelectors, "getRenderMode")
        .mockImplementation(() => RenderModes.PAGE);
      jest
        .spyOn(layoutSystemSelectors, "getLayoutSystemType")
        .mockImplementation(() => LayoutSystemTypes.ANVIL);
      const component = render(<HOC {...widgetProps} />);
      const flexPositionedLayer =
        component.container.ownerDocument.getElementById(
          "anvil_widget_" + widgetProps.widgetId,
        );

      expect(flexPositionedLayer).toBeTruthy();
    });
  });
});
