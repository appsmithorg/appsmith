import { LabelOrientation } from "widgets/ChartWidget/constants";
import type { ChartType } from "widgets/ChartWidget/constants";

export class EChartsXAxisLayoutBuilder {
  labelOrientation: LabelOrientation;
  chartType: ChartType;

  gapBetweenLabelAndName = 10;
  defaultHeightForXAxisLabels = 30;
  defaultHeightForXAxisName = 40;

  constructor(labelOrientation: LabelOrientation, chartType: ChartType) {
    this.labelOrientation = labelOrientation;
    this.chartType = chartType;
  }

  configForXAxis() {
    return {
      nameGap: this.heightForXAxisLabels(),
      axisLabel: {
        width: this.widthForXAxisLabels(),
      },
    };
  }

  heightForXAxis = () => {
    if (this.chartType == "PIE_CHART") {
      return 0;
    }
    return this.heightForXAxisLabels() + this.defaultHeightForXAxisName;
  };

  heightForXAxisLabels = () => {
    let labelsHeight: number = this.defaultHeightForXAxisLabels;
    if (this.labelOrientation != LabelOrientation.AUTO) {
      labelsHeight = this.widthForXAxisLabels();
    }
    return labelsHeight + this.gapBetweenLabelAndName;
  };

  widthForXAxisLabels = () => {
    switch (this.labelOrientation) {
      case LabelOrientation.SLANT: {
        return 50;
      }
      default: {
        return 60;
      }
    }
  };
}
