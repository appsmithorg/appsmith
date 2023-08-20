export class EChartsYAxisLayoutBuilder {
  minimumWidth = 150;
  width: number;

  constructor(width: number) {
    this.width = width;
  }

  showYAxisConfig = () => {
    return this.width >= this.minimumWidth;
  };

  gridLeftOffset = () => {
    return this.showYAxisConfig() ? 100 : 5;
  };

  config = () => {
    return {
      show: this.showYAxisConfig(),
      nameGap: 70,
      axisLabel: {
        width: 60,
      },
    };
  };
}
