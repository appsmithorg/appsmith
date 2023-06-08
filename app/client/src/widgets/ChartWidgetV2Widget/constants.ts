// This file contains common constants which can be used across the widget configuration file (index.ts), widget and component folders.
export const CHARTWIDGETV2_WIDGET_CONSTANT = "";

export interface ChartSelectedDataPoint {
  data: unknown;
  seriesName: string;
}

export type ChartType =
  | "LINE_CHART"
  | "BAR_CHART"
  | "PIE_CHART"
  | "COLUMN_CHART"
  | "AREA_CHART"
  | "CUSTOM_ECHARTS_CHART";

export const defaultChartDataset = {
  dimensions: ["product", "2015", "2016", "2017"],
  source: [
    { product: "Matcha Latte", "2015": 84.3, "2016": 65.8, "2017": 15 },
    { product: "Milk Tea", "2015": 83.1, "2016": 73.4, "2017": 55.1 },
    { product: "Cheese Cocoa", "2015": 86.4, "2016": 65.2, "2017": 40 },
    { product: "Walnut Brownie", "2015": 72.4, "2016": 53.9, "2017": 39.1 },
  ],
};

export const DefaultChartConfigs: Record<ChartType, Record<any, unknown>> = {
  BAR_CHART: {
    legend: {},
    xAxis: { type: "value" },
    yAxis: { type: "category" },

    title: {
      text: "Tea Revenue",
    },
    series: [{ type: "bar" }, { type: "bar" }, { type: "bar" }],
  },
  LINE_CHART: {
    legend: {},
    xAxis: { type: "category" },
    yAxis: {},
    title: {
      text: "Tea Revenue",
    },
    series: [{ type: "line" }, { type: "line" }, { type: "line" }],
  },
  PIE_CHART: {
    legend: {},
    xAxis: { type: "category" },
    yAxis: {},
    title: [
      {
        text: "Tea Revenue",
      },
      {
        text: "2015",
        top: "15%",
        left: "25%",
        textAlign: "center",
      },
      {
        text: "2016",
        top: "15%",
        left: "50%",
        textAlign: "center",
      },
      {
        text: "2017",
        top: "15%",
        left: "75%",
        textAlign: "center",
      },
    ],
    series: [
      {
        type: "pie",
        radius: "40%",
        center: ["25%", "50%"],
        encode: {
          itemName: "product",
          value: "2015",
        },
      },
      {
        type: "pie",
        radius: "40%",
        center: ["50%", "50%"],
        encode: {
          itemName: "product",
          value: "2016",
        },
      },
      {
        type: "pie",
        radius: "40%",
        center: ["75%", "50%"],
        encode: {
          itemName: "product",
          value: "2017",
        },
      },
    ],
  },
  COLUMN_CHART: {
    legend: {},
    xAxis: { type: "category" },
    yAxis: {},
    title: {
      text: "Tea Revenue",
    },
    series: [{ type: "bar" }, { type: "bar" }, { type: "bar" }],
  },
  AREA_CHART: {
    legend: {},
    xAxis: { type: "category" },
    yAxis: {},
    title: {
      text: "Tea Revenue",
    },
    series: [
      { type: "line", areaStyle: {} },
      { type: "line", areaStyle: {} },
      { type: "line", areaStyle: {} },
    ],
  },
  // SCATTER_CHART: {
  //   legend: {},
  //     xAxis: { type: 'category' },
  //       yAxis: {},
  //       title: {
  //         title: "Tea Revenue"
  //       },
  //       series: [{type: 'scatter'}, {type: 'scatter'}, {type: 'scatter'}],
  //   },
  CUSTOM_ECHARTS_CHART: {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {},
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
    ],
    yAxis: [
      {
        type: "value",
      },
    ],
    series: [
      {
        name: "Direct",
        type: "bar",
        emphasis: {
          focus: "series",
        },
        data: [320, 332, 301, 334, 390, 330, 320],
      },
      {
        name: "Email",
        type: "bar",
        stack: "Ad",
        emphasis: {
          focus: "series",
        },
        data: [120, 132, 101, 134, 90, 230, 210],
      },
      {
        name: "Union Ads",
        type: "bar",
        stack: "Ad",
        emphasis: {
          focus: "series",
        },
        data: [220, 182, 191, 234, 290, 330, 310],
      },
      {
        name: "Video Ads",
        type: "bar",
        stack: "Ad",
        emphasis: {
          focus: "series",
        },
        data: [150, 232, 201, 154, 190, 330, 410],
      },
      {
        name: "Search Engine",
        type: "bar",
        data: [862, 1018, 964, 1026, 1679, 1600, 1570],
        emphasis: {
          focus: "series",
        },
        markLine: {
          lineStyle: {
            type: "dashed",
          },
          data: [[{ type: "min" }, { type: "max" }]],
        },
      },
      {
        name: "Baidu",
        type: "bar",
        barWidth: 5,
        stack: "Search Engine",
        emphasis: {
          focus: "series",
        },
        data: [620, 732, 701, 734, 1090, 1130, 1120],
      },
      {
        name: "Google",
        type: "bar",
        stack: "Search Engine",
        emphasis: {
          focus: "series",
        },
        data: [120, 132, 101, 134, 290, 230, 220],
      },
      {
        name: "Bing",
        type: "bar",
        stack: "Search Engine",
        emphasis: {
          focus: "series",
        },
        data: [60, 72, 71, 74, 190, 130, 110],
      },
      {
        name: "Others",
        type: "bar",
        stack: "Search Engine",
        emphasis: {
          focus: "series",
        },
        data: [62, 82, 91, 84, 109, 110, 120],
      },
    ],
  },
};
