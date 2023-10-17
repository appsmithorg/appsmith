import type { WidgetSizeConfig } from "WidgetProvider/constants";
import WidgetFactory from "WidgetProvider/factory";
import { addPixelToSize } from "layoutSystems/common/utils/commonUtils";
import { type RefObject, useRef } from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export interface SizeConfig {
  maxHeight: Record<string, string>;
  maxWidth: Record<string, string>;
  minHeight: Record<string, string>;
  minWidth: Record<string, string>;
}

export const defaultSizeConfig: SizeConfig = {
  maxHeight: {},
  maxWidth: {},
  minHeight: {},
  minWidth: {},
};

export const useWidgetSizeConfiguration = (
  type: string,
  props: BaseWidgetProps,
): SizeConfig => {
  let ref: SizeConfig = defaultSizeConfig;

  const { widgetSize } = WidgetFactory.getWidgetAnvilConfig(type);

  if (!widgetSize || !widgetSize?.length) return ref;

  widgetSize.forEach((size: WidgetSizeConfig) => {
    const data = size.configuration(props);
    console.log("!!!!", {
      type,
      data,
      maxWidth: data.maxWidth,
      viewport: size.viewportMinWidth,
      ref,
    });
    if (size.viewportMinWidth === 0) {
      //  WDS flex component doesn't handle null || undefined values. Hence, add in properties only if they are defined.
      if (data?.maxHeight)
        ref.maxHeight = { base: addPixelToSize(data.maxHeight) };
      if (data?.maxWidth)
        ref.maxWidth = { base: addPixelToSize(data.maxWidth) };
      if (data?.minHeight)
        ref.minHeight = { base: addPixelToSize(data.minHeight) };
      if (data?.minWidth)
        ref.minWidth = { base: addPixelToSize(data.minWidth) };
      console.log("!!!! base", { type, ref });
      return;
    }

    if (data?.maxHeight) {
      console.log("!!!! maxHeight", {
        val: data?.maxHeight,
        viewport: size.viewportMinWidth,
      });
      ref.maxHeight[addPixelToSize(size.viewportMinWidth)] = addPixelToSize(
        data?.maxHeight,
      );
    }
    if (data?.maxWidth) {
      console.log("!!!! maxWidth", {
        val: data?.maxWidth,
        viewport: size.viewportMinWidth,
      });
      ref.maxWidth[addPixelToSize(size.viewportMinWidth)] = addPixelToSize(
        data?.maxWidth,
      );
    }
    if (data?.minHeight) {
      console.log("!!!! minHeight", {
        val: data?.minHeight,
        viewport: size.viewportMinWidth,
      });
      ref.minHeight[addPixelToSize(size.viewportMinWidth)] = addPixelToSize(
        data?.minHeight,
      );
    }
    if (data?.minWidth) {
      console.log("!!!! minWidth", {
        val: data?.minWidth,
        viewport: size.viewportMinWidth,
      });
      ref.minWidth[addPixelToSize(size.viewportMinWidth)] = addPixelToSize(
        data?.minWidth,
      );
    }
    console.log("!!!! after", { type, ref });
  });
  console.log("!!!!", { type, ref: ref, widgetSize });
  return ref;
};
