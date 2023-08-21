import type {
  ChartType,
  LabelOrientation,
} from "widgets/ChartWidget/constants";
import { EChartElementVisibilityCalculator } from "./EChartsElementVisibilityCalculator";
import { EChartsXAxisLayoutBuilder } from "./EChartsXAxisLayoutBuilder";
import { EChartsYAxisLayoutBuilder } from "./EChartsYAxisLayoutBuilder";

type LayoutProps = {
  allowScroll: boolean;
  height: number;
  width: number;
  labelOrientation: LabelOrientation;
  chartType: ChartType;
  chartTitle: string;
};

export class EChartsLayoutBuilder {
  minimumHeight = 80;
  gridPadding = 30;

  heightForAllowScollBar = 30;
  scrollBarBottomOffset = 30;

  heightForLegend = 50;
  heightForTitle = 50;

  priorityOrderOfInclusion = ["xAxis", "legend", "title", "scrollBar"];

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
    this.xAxisLayoutBuilder = new EChartsXAxisLayoutBuilder(
      this.props.labelOrientation,
      this.props.chartType,
    );
    this.yAxisLayoutBuilder = new EChartsYAxisLayoutBuilder(this.props.width);

    this.elementVisibilityLayoutBuilder = new EChartElementVisibilityCalculator(
      {
        height: props.height,
        minimumHeight: this.minimumHeight,
        layoutConfigs: this.configParamsForVisibilityCalculation(),
        padding: this.gridPadding,
      },
    );

    this.layoutConfig = this.layoutConfigForElements();
  }

  heightForElement = (elementName: string): number => {
    switch (elementName) {
      case "xAxis":
        return this.xAxisLayoutBuilder.heightForXAxis();
      case "legend":
        return this.heightForLegend;
      case "title":
        return this.heightForTitle;
      case "scrollBar":
        return this.layoutHeightForScrollBar();
      default:
        return 0;
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

    config.xAxis = {
      ...config.xAxis,
      ...this.xAxisLayoutBuilder.configForXAxis(),
    };

    config.scrollBar = {
      ...config.scrollBar,
      bottom: this.scrollBarBottomOffset,
      height: this.heightForAllowScollBar,
    };

    return config;
  };

  layoutConfigForElements = () => {
    const { bottom, top } = this.elementVisibilityLayoutBuilder.visibleElements;
    const visibilityConfig = [...top, ...bottom];

    const output = this.defaultConfigForElements();

    visibilityConfig.forEach((config) => {
      output[config.elementName].show = true;
    });

    const gridOffsets = this.elementVisibilityLayoutBuilder.calculateOffsets();

    output.grid.top = gridOffsets.top;
    output.grid.bottom = gridOffsets.bottom;
    output.legend.top = output.title.show ? 50 : 0;

    return output;
  };

  configParamsForVisibilityCalculation = () => {
    return this.configsToInclude().map((element) => {
      return {
        elementName: element,
        position: this.positionLayoutForElement[element],
        height: this.heightForElement(element),
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
      if (configName == "xAxis") {
        return this.props.chartType != "PIE_CHART";
      }
      if (configName == "title") {
        return this.props.chartTitle.length > 0;
      }
      return true;
    });
  }
}
