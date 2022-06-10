import Widget from "../ChartWidget/widget";
import { CONFIG as CHART_CONFIG } from "../ChartWidget/index";

export const CONFIG = {
  ...CHART_CONFIG,
  type: "BAR_CHART_WIDGET",
  name: "Bar Chart",
  defaults: {
    ...CHART_CONFIG.defaults,
    widgetName: "BarChart",
    chartType: "BAR_CHART",
  },
};

export default Widget;
