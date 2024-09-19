import type {
  AllChartData,
  ChartType,
  LabelOrientation,
  LongestLabelParams,
} from "widgets/ChartWidget/constants";
import type { EChartElementLayoutParams } from "./EChartsElementVisibilityCalculator";
import { EChartElementVisibilityCalculator } from "./EChartsElementVisibilityCalculator";
import { EChartsXAxisLayoutBuilder } from "./EChartsXAxisLayoutBuilder";
import { EChartsYAxisLayoutBuilder } from "./EChartsYAxisLayoutBuilder";

interface LayoutProps {
  allowScroll: boolean;
  widgetHeight: number;
  widgetWidth: number;
  labelOrientation: LabelOrientation;
  chartType: ChartType;
  chartTitle: string;
  seriesConfigs: AllChartData;
  font: string;
  longestLabels: LongestLabelParams;
}

export class EChartsLayoutBuilder {
  gridMinimumHeight = 80;
  gridPadding = 30;

  heightForAllowScollBar = 30;
  scrollBarBottomOffset = 30;

  heightForLegend = 50;
  heightForTitle = 60;

  priorityOrderOfInclusion = ["legend", "title", "xAxis", "scrollBar"];

  positionLayoutForElement: Record<string, "top" | "bottom"> = {
    xAxis: "bottom",
    legend: "top",
    title: "top",
    scrollBar: "bottom",
  };

  props: LayoutProps;

  layoutConfig: Record<string, Record<string, unknown>>;

  xAxisLayoutBuilder: EChartsXAxisLayoutBuilder;
  yAxisLayoutBuilder: EChartsYAxisLayoutBuilder;
  elementVisibilityLayoutBuilder: EChartElementVisibilityCalculator;

  constructor(props: LayoutProps) {
    this.props = props;
    this.xAxisLayoutBuilder = new EChartsXAxisLayoutBuilder({
      labelOrientation: this.props.labelOrientation,
      chartType: this.props.chartType,
      font: this.props.font,
      longestLabel: this.props.longestLabels,
    });

    this.yAxisLayoutBuilder = new EChartsYAxisLayoutBuilder({
      widgetWidth: this.props.widgetWidth,
      chartType: this.props.chartType,
      font: this.props.font,
      longestLabel: this.props.longestLabels,
    });

    this.elementVisibilityLayoutBuilder = new EChartElementVisibilityCalculator(
      {
        height: props.widgetHeight,
        gridMinimumHeight: this.gridMinimumHeight,
        layoutConfigs: this.configParamsForVisibilityCalculation(),
        padding: this.gridPadding,
      },
    );

    this.layoutConfig = this.layoutConfigForElements();
  }

  heightConfigForElement = (
    elementName: string,
  ): { minHeight: number; maxHeight: number } => {
    switch (elementName) {
      case "xAxis":
        return this.xAxisLayoutBuilder.heightConfigForXAxis();
      case "legend":
        return {
          minHeight: this.heightForLegend,
          maxHeight: this.heightForLegend,
        };
      case "title":
        return {
          minHeight: this.heightForTitle,
          maxHeight: this.heightForTitle,
        };
      case "scrollBar":
        return {
          minHeight: this.layoutHeightForScrollBar(),
          maxHeight: this.layoutHeightForScrollBar(),
        };
      default:
        return {
          minHeight: 0,
          maxHeight: 0,
        };
    }
  };

  layoutHeightForScrollBar = () => {
    return this.heightForAllowScollBar + this.scrollBarBottomOffset;
  };

  defaultConfigForElements = (): Record<string, Record<string, unknown>> => {
    const config: Record<string, Record<string, unknown>> = {};

    this.priorityOrderOfInclusion.map((elementName) => {
      config[elementName] = {
        show: false,
      };
    });
    config.grid = this.defaultConfigForGrid();
    config.yAxis = this.yAxisLayoutBuilder.config();

    config.scrollBar = {
      ...config.scrollBar,
      bottom: this.scrollBarBottomOffset,
      height: this.heightForAllowScollBar,
    };

    return config;
  };

  layoutConfigForXAxis = () => {
    const visibilityConfig =
      this.elementVisibilityLayoutBuilder.visibleElements;
    const xAxisConfig = visibilityConfig.find((config) => {
      return config.elementName == "xAxis";
    });

    const xAxisConfigHeight = xAxisConfig?.height ?? 0;

    return this.xAxisLayoutBuilder.configForXAxis(xAxisConfigHeight);
  };

  layoutConfigForElements = () => {
    const visibilityConfig =
      this.elementVisibilityLayoutBuilder.visibleElements;

    const output = this.defaultConfigForElements();

    visibilityConfig.forEach((config) => {
      output[config.elementName].show = true;
    });

    const gridOffsets = this.elementVisibilityLayoutBuilder.calculateOffsets();

    output.grid.top = gridOffsets.top;
    output.grid.bottom = gridOffsets.bottom;
    output.legend.top = output.title.show ? 50 : 0;
    output.xAxis = {
      ...output.xAxis,
      ...this.layoutConfigForXAxis(),
    };

    return output;
  };

  configParamsForVisibilityCalculation = (): EChartElementLayoutParams[] => {
    return this.configsToInclude().map((element) => {
      return {
        elementName: element,
        position: this.positionLayoutForElement[element],
        ...this.heightConfigForElement(element),
      };
    });
  };

  defaultConfigForGrid() {
    return {
      top: 0,
      bottom: 0,
      left: this.yAxisLayoutBuilder.gridLeftOffset(),
    };
  }

  configsToInclude() {
    return this.priorityOrderOfInclusion.filter((configName) => {
      if (configName == "scrollBar") {
        return this.props.allowScroll;
      }

      if (configName == "legend") {
        return this.needsLegend(this.props.seriesConfigs);
      }

      if (configName == "xAxis") {
        return this.props.chartType != "PIE_CHART";
      }

      if (configName == "title") {
        return this.props.chartTitle.length > 0;
      }

      return true;
    });
  }

  needsLegend(seriesConfigs: AllChartData) {
    const seriesKeys = Object.keys(seriesConfigs);
    const numSeries = seriesKeys.length;

    if (numSeries == 0) {
      return false;
    } else if (numSeries == 1) {
      const seriesTitle = seriesConfigs[seriesKeys[0]].seriesName ?? "";

      return seriesTitle.length > 0;
    } else {
      return true;
    }
  }
}
