import { LabelOrientation } from "widgets/ChartWidget/constants";
import type {
  ChartType,
  LongestLabelParams,
} from "widgets/ChartWidget/constants";
import { getTextWidth, labelKeyForChart } from "../helpers";

interface XAxisLayoutBuilderParams {
  labelOrientation: LabelOrientation;
  chartType: ChartType;
  font: string;
  longestLabel: LongestLabelParams;
}
export class EChartsXAxisLayoutBuilder {
  props: XAxisLayoutBuilderParams;

  gapBetweenLabelAndName = 10;
  defaultHeightForXAxisLabels = 30;
  defaultHeightForRotatedLabels = 50;
  defaultHeightForXAxisName = 40;

  constructor(props: XAxisLayoutBuilderParams) {
    this.props = props;
  }

  configForXAxis(width: number) {
    return {
      nameGap: width - this.defaultHeightForXAxisName,
      axisLabel: this.axisLabelConfig(width),
    };
  }

  axisLabelConfig = (allocatedXAxisHeight: number) => {
    if (this.props.labelOrientation == LabelOrientation.AUTO) {
      return {
        width: allocatedXAxisHeight,
        overflow: "truncate",
        hideOverlap: true,
        interval: 0,
      };
    } else {
      return {
        width:
          allocatedXAxisHeight -
          this.defaultHeightForXAxisName -
          this.gapBetweenLabelAndName,
        overflow: "truncate",
        hideOverlap: true,
        interval: 0,
      };
    }
  };

  heightConfigForXAxis = () => {
    let minHeight = this.minHeightForLabels();
    const maxHeight = this.maxHeightForXAxis();

    minHeight = minHeight > maxHeight ? maxHeight : minHeight;

    return {
      minHeight: minHeight,
      maxHeight: maxHeight,
    };
  };

  maxHeightForXAxis = () => {
    if (this.props.chartType == "PIE_CHART") {
      return 0;
    } else {
      return this.maxHeightForXAxisLabels() + this.defaultHeightForXAxisName;
    }
  };

  maxHeightForXAxisLabels = (): number => {
    let labelsHeight: number;

    if (this.props.labelOrientation == LabelOrientation.AUTO) {
      labelsHeight = this.defaultHeightForXAxisLabels;
    } else {
      labelsHeight = this.widthForXAxisLabels();
    }

    return labelsHeight + this.gapBetweenLabelAndName;
  };

  minHeightForLabels() {
    if (this.props.chartType == "PIE_CHART") {
      return 0;
    }

    let labelsHeight: number;

    if (this.props.labelOrientation == LabelOrientation.AUTO) {
      labelsHeight = this.defaultHeightForXAxisLabels;
    } else {
      labelsHeight = this.defaultHeightForRotatedLabels;
    }

    return (
      labelsHeight +
      this.gapBetweenLabelAndName +
      this.defaultHeightForXAxisName
    );
  }

  widthForXAxisLabels = () => {
    switch (this.props.labelOrientation) {
      case LabelOrientation.AUTO: {
        return 0;
      }
      default: {
        const longestLabelKey = labelKeyForChart("xAxis", this.props.chartType);

        return getTextWidth(
          this.props.longestLabel[longestLabelKey],
          this.props.font,
        );
      }
    }
  };
}
