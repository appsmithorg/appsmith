import type { ChartDataPoint } from "../constants";

export const getSeriesChartData = (
  data: ChartDataPoint[],
  categories: string[],
) => {
  const dataMap: { [key: string]: string } = {};

  // if not array or (is array and array length is zero)
  if (!Array.isArray(data) || (Array.isArray(data) && data.length === 0)) {
    return [
      {
        value: "",
      },
    ];
  }
  for (let index = 0; index < data.length; index++) {
    const item: ChartDataPoint = data[index];
    dataMap[item.x] = item.y;
  }
  return categories.map((category: string) => {
    return {
      value:
        dataMap[category] || dataMap[category]?.toString()
          ? dataMap[category]
          : null,
    };
  });
};
