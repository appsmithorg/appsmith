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
  paddingFromLabels = 10;
  labelsPaddingFromXAxis = 8;
  commaPadding = 10;
  nameGapWidth = 30;

  constructor(props: YAxisLayoutBuilderParams) {
    this.props = props;

    this.labelsWidth = this.widthForLabels();

    this.nameGap =
      this.labelsWidth + this.labelsPaddingFromXAxis + this.paddingFromLabels;
    this.leftOffset = this.nameGap + this.nameGapWidth;
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

    return labelWidthYAxis;
  };
}
