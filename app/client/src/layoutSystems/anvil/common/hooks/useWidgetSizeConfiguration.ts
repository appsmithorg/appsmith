import type { SizeConfig } from "WidgetProvider/constants";
import WidgetFactory from "WidgetProvider/factory";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { isFunction } from "lodash";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

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
  let res: SizeConfig = defaultSizeConfig;

  const { widgetSize } = WidgetFactory.getWidgetAnvilConfig(type);

  if (!widgetSize) return res;

  if (isFunction(widgetSize)) {
    res = widgetSize(props);
  } else if (Object.keys(widgetSize).length) {
    res = widgetSize;
  }

  return {
    ...res,
    minHeight: Object.keys(res.minHeight).length
      ? res.minHeight
      : {
          base: `${WidgetFactory.widgetConfigMap.get(type)?.minHeight || 80}px`,
        },
    minWidth: Object.keys(res.minWidth).length
      ? res.minWidth
      : {
          base: `${
            WidgetFactory.widgetConfigMap.get(type)?.minWidth ||
            FILL_WIDGET_MIN_WIDTH
          }px`,
        },
  };
};
