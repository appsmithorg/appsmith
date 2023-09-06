import { isFunction } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type {
  AutoDimensionOptions,
  AutoLayoutConfig,
  WidgetSizeConfig,
} from "widgets/constants";

export const getAutoDimensionsConfig = (
  config: AutoLayoutConfig,
  props: BaseWidgetProps,
): AutoDimensionOptions | undefined => {
  let autoDimensionConfig = config.autoDimension;
  if (isFunction(autoDimensionConfig)) {
    autoDimensionConfig = autoDimensionConfig(props);
  }
  if (props.isListItemContainer && autoDimensionConfig) {
    autoDimensionConfig.height = false;
  }
  return autoDimensionConfig;
};

export const getAutoLayoutWidgetConfig = (
  props: BaseWidgetProps,
): AutoLayoutConfig => {
  return WidgetFactory.getWidgetAutoLayoutConfig(props.type);
};

// TODO: update sizeConfig structure and get rid of this method.
export const restructureWidgetSizeConfig = (
  sizeConfig: Array<WidgetSizeConfig> | undefined,
  props: BaseWidgetProps,
): {
  maxHeight: Record<string, string | number>;
  maxWidth: Record<string, string | number>;
  minHeight: Record<string, string | number>;
  minWidth: Record<string, string | number>;
} => {
  if (!sizeConfig || !sizeConfig.length)
    return { maxHeight: {}, maxWidth: {}, minHeight: {}, minWidth: {} };
  return sizeConfig.reduce(
    (acc: any, size: WidgetSizeConfig) => {
      const data = size.configuration(props);
      if (size.viewportMinWidth === 0)
        return {
          maxHeight: { base: data?.maxHeight },
          maxWidth: { base: data?.maxWidth },
          minHeight: { base: data?.minHeight },
          minWidth: { base: data?.minWidth },
        };
      return {
        maxHeight: data?.maxHeight
          ? {
              ...acc.maxHeight,
              [size.viewportMinWidth]: data?.maxHeight,
            }
          : acc,
        maxWidth: data?.maxWidth
          ? { ...acc.maxWidth, [size.viewportMinWidth]: data?.maxWidth }
          : acc,
        minHeight: data?.minHeight
          ? {
              ...acc.minHeight,
              [size.viewportMinWidth]: data?.minHeight,
            }
          : acc,
        minWidth: data?.minWidth
          ? { ...acc.minWidth, [size.viewportMinWidth]: data?.minWidth }
          : acc,
      };
    },
    {
      maxHeight: {},
      maxWidth: {},
      minHeight: {},
      minWidth: {},
    },
  );
};
