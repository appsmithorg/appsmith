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
    
    this.nameGap = this.labelsWidth + this.labelsPaddingFromXAxis + this.paddingFromLabels;
    this.leftOffset = this.nameGap + this.nameGapWidth;

    console.log("***", "label width is ", this.labelsWidth)
    console.log("***", "name gap is ", this.nameGap)
    console.log("***", "left offset is ", this.leftOffset)
  }

  showYAxisConfig = () => {
    return this.props.widgetWidth >= this.minimumWidth;
  };

  gridLeftOffset = () => {
    let result = this.showYAxisConfig() ? this.leftOffset : 5;
    return result
  };

  config = () => {
    const result = {
      show: this.showYAxisConfig(),
      nameGap: this.nameGap,
      axisLabel: {
        width: this.labelsWidth,
        overflow: "truncate",
      },
    };
    console.log("***", "config result is ", result)
    return result;
  };

  widthForLabels = () => {
    const availableSpace = this.props.widgetWidth - this.minimumWidth;
    const maxWidth = this.maxWidthForLabels();
    console.log("****", "max width is ", maxWidth, "available space is ", availableSpace)

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

    console.log("***", "props font is ", this.props.font)
    console.log("***", "longest label is ", this.props.longestLabel[longestLabelKey], labelWidthYAxis)
    return labelWidthYAxis;
  };
}
