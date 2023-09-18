import type {
  ChartType,
  LongestLabelParams,
} from "widgets/ChartWidget/constants";
import { getTextWidth, labelKeyForChart } from "../helpers";

interface YAxisLayoutBuilderParams {
  widgetWidth: number;
  chartType: ChartType;
  font: string;
  longestLabel: LongestLabelParams;
}
export class EChartsYAxisLayoutBuilder {
  props: YAxisLayoutBuilderParams;
  minimumWidth = 150;
  labelsWidth: number;
  nameGap: number;
  leftOffset: number;

  constructor(props: YAxisLayoutBuilderParams) {
    this.props = props;

    this.labelsWidth = this.widthForLabels();
    this.nameGap = this.labelsWidth + 10;
    this.leftOffset = this.nameGap + 30;
  }

  showYAxisConfig = () => {
    return this.props.widgetWidth >= this.minimumWidth;
  };

  gridLeftOffset = () => {
    return this.showYAxisConfig() ? this.leftOffset : 5;
  };

  config = () => {
    return {
      show: this.showYAxisConfig(),
      nameGap: this.nameGap,
      axisLabel: {
        width: this.labelsWidth,
        overflow: "truncate",
      },
    };
  };

  widthForLabels = () => {
    const availableSpace = this.props.widgetWidth - this.minimumWidth;
    const maxWidth = this.maxWidthForLabels();

    if (maxWidth < availableSpace) {
      return maxWidth;
    } else {
      return availableSpace;
    }
  };

  maxWidthForLabels = () => {
    const longestLabelKey = labelKeyForChart("yAxis", this.props.chartType);
    const labelWidthYAxis = getTextWidth(
      this.props.longestLabel[longestLabelKey],
      this.props.font,
    );
    return labelWidthYAxis + 10;
  };
}
