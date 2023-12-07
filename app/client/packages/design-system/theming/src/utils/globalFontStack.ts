import { createFontStack } from "@capsizecss/core";
import appleSystem from "@capsizecss/metrics/appleSystem";
import BlinkMacSystemFont from "@capsizecss/metrics/blinkMacSystemFont";
import roboto from "@capsizecss/metrics/roboto";
import segoeUI from "@capsizecss/metrics/segoeUI";
import ubuntu from "@capsizecss/metrics/ubuntu";

export const globalFontStack = () => {
  return createFontStack(
    [appleSystem, BlinkMacSystemFont, segoeUI, roboto, ubuntu],
    {
      fontFaceFormat: "styleString",
    },
  );
};
