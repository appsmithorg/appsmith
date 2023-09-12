/* eslint-disable no-console */
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type {
  AutoDimensionOptions,
  AutoDimensionValues,
  AutoLayoutConfig,
  WidgetConfiguration,
} from "WidgetProvider/constants";
import {
  getAutoDimensionsConfig,
  restructureWidgetSizeConfig,
} from "./commonUtils";
import InputWidget from "widgets/InputWidgetV2/widget";
import ButtonWidget from "widgets/ButtonWidget/widget";

const inputProps: BaseWidgetProps = {
  type: "INPUT_WIDGET_V2",
  widgetId: "1",
  widgetName: "Input1",
  renderMode: "CANVAS",
  version: 1,
  isLoading: false,
  parentColumnSpace: 10,
  parentRowSpace: 10,
  leftColumn: 0,
  rightColumn: 10,
  topRow: 0,
  bottomRow: 7,
};

describe("Common Utils tests", () => {
  describe("getAutoDimensionsConfig", () => {
    it("autoDimension.height for InputWidgetV2 should be true", () => {
      const config: AutoLayoutConfig | undefined = (
        InputWidget.getConfig() as WidgetConfiguration
      ).autoLayout;
      const autoDimension: AutoDimensionOptions | undefined =
        getAutoDimensionsConfig(config || {}, inputProps);
      expect((autoDimension as AutoDimensionValues)?.height).toBeTruthy();
    });
    it("autoDimension.width for button widget should be true", () => {
      const config: AutoLayoutConfig | undefined = (
        ButtonWidget.getConfig() as WidgetConfiguration
      ).autoLayout;
      const autoDimension: AutoDimensionOptions | undefined =
        getAutoDimensionsConfig(config || {}, {
          ...inputProps,
          type: "BUTTON_WIDGET",
        });
      expect((autoDimension as AutoDimensionValues)?.width).toBeTruthy();
      expect((autoDimension as AutoDimensionValues)?.height).toBeFalsy();
    });
  });
  describe("restructureWidgetSizeConfig", () => {
    it("should return widget size config in the structure accepted by WDS Flex component - BUTTON widget", () => {
      const config: AutoLayoutConfig | undefined = (
        ButtonWidget.getConfig() as WidgetConfiguration
      ).autoLayout;
      const sizeConfig: {
        maxHeight: Record<string, string | number>;
        maxWidth: Record<string, string | number>;
        minHeight: Record<string, string | number>;
        minWidth: Record<string, string | number>;
      } = restructureWidgetSizeConfig(config?.widgetSize || [], {
        ...inputProps,
        type: "BUTTON_WIDGET",
      });

      expect(sizeConfig.minWidth.base).toEqual("120px");
      expect(sizeConfig.minHeight.base).toEqual("40px");
      expect(sizeConfig.maxWidth.base).toEqual("360px");
      expect(sizeConfig.maxHeight.base).toBeFalsy();
    });
    it("should return widget size config in the structure accepted by WDS Flex component - INPUT widget", () => {
      const config: AutoLayoutConfig | undefined = (
        InputWidget.getConfig() as WidgetConfiguration
      ).autoLayout;
      const sizeConfig: {
        maxHeight: Record<string, string | number>;
        maxWidth: Record<string, string | number>;
        minHeight: Record<string, string | number>;
        minWidth: Record<string, string | number>;
      } = restructureWidgetSizeConfig(config?.widgetSize || [], inputProps);

      expect(sizeConfig.minWidth.base).toEqual("120px");
      expect(sizeConfig.minHeight.base).toBeFalsy();
      expect(sizeConfig.maxWidth.base).toBeFalsy();
      expect(sizeConfig.maxHeight.base).toBeFalsy();
    });
  });
});
