import type {
  AutoDimensionOptions,
  AutoLayoutConfig,
  WidgetSizeConfig,
} from "WidgetProvider/constants";
import WidgetFactory from "WidgetProvider/factory";
import { isFunction } from "lodash";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

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
  maxHeight: Record<string, string>;
  maxWidth: Record<string, string>;
  minHeight: Record<string, string>;
  minWidth: Record<string, string>;
} => {
  /**
   * Size config is stored as an array of objects.
   * Each object has a viewportMinWidth and a configuration function that returns the minMax sizes at the viewport.
   * e.g [{ viewportMinWidth: 0, configuration: (props) => ({ maxHeight: 400, minWidth: 100 })}]
   *
   * WDS flex component requires the same information in a different structure (Responsive<T>):
   * minWidth: { base: '100px', '480px': '200px'  }, // default min width is 100px. However, above container width of 480px, min width changes to 200px.
   * maxHeight: { base: 400 },
   */
  // TODO: We should look into how size config is stored. Both structure and values can be updated.
  const res: {
    maxHeight: Record<string, string>;
    maxWidth: Record<string, string>;
    minHeight: Record<string, string>;
    minWidth: Record<string, string>;
  } = {
    maxHeight: {},
    maxWidth: {},
    minHeight: {},
    minWidth: {},
  };

  if (!sizeConfig || !sizeConfig.length) return res;

  return sizeConfig.reduce(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc: any, size: WidgetSizeConfig) => {
      const data = size.configuration(props);

      if (size.viewportMinWidth === 0) {
        //  WDS flex component doesn't handle null || undefined values. Hence, add in properties only if they are defined.
        const res = {
          maxHeight: {},
          maxWidth: {},
          minHeight: {},
          minWidth: {},
        };

        if (data?.maxHeight)
          res.maxHeight = { base: addPixelToSize(data.maxHeight) };

        if (data?.maxWidth)
          res.maxWidth = { base: addPixelToSize(data.maxWidth) };

        if (data?.minHeight)
          res.minHeight = { base: addPixelToSize(data.minHeight) };

        if (data?.minWidth)
          res.minWidth = { base: addPixelToSize(data.minWidth) };

        return res;
      }

      return {
        maxHeight: data?.maxHeight
          ? {
              ...acc.maxHeight,
              [addPixelToSize(size.viewportMinWidth)]: addPixelToSize(
                data?.maxHeight,
              ),
            }
          : acc,
        maxWidth: data?.maxWidth
          ? {
              ...acc.maxWidth,
              [addPixelToSize(size.viewportMinWidth)]: addPixelToSize(
                data?.maxWidth,
              ),
            }
          : acc,
        minHeight: data?.minHeight
          ? {
              ...acc.minHeight,
              [addPixelToSize(size.viewportMinWidth)]: addPixelToSize(
                data?.minHeight,
              ),
            }
          : acc,
        minWidth: data?.minWidth
          ? {
              ...acc.minWidth,
              [addPixelToSize(size.viewportMinWidth)]: addPixelToSize(
                data?.minWidth,
              ),
            }
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

export const addPixelToSize = (size: number | string): string => {
  if (!size) return "";

  return typeof size === "string" ? size : `${size}px`;
};
