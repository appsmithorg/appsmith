export type EChartElementLayoutParams = Omit<
  EChartVisibleElementConfig,
  "height"
>;

export interface EChartVisibleElementConfig {
  elementName: string;
  height: number;
  minHeight: number;
  maxHeight: number;
  position: "top" | "bottom";
}

export interface EChartElementVisibilityProps {
  height: number;
  padding: number;
  gridMinimumHeight: number;
  layoutConfigs: EChartElementLayoutParams[];
}

export class EChartElementVisibilityCalculator {
  props: EChartElementVisibilityProps;
  visibleElements: EChartVisibleElementConfig[];

  constructor(props: EChartElementVisibilityProps) {
    this.props = props;
    this.visibleElements = this.selectElementsForVisibility();
  }

  needsCustomTopPadding() {
    return this.visibleElements.every((config) => config.position != "top");
  }

  needsCustomBottomPadding() {
    return this.visibleElements.every((config) => config.position != "bottom");
  }

  calculateOffsets() {
    let top = this.needsCustomTopPadding() ? this.props.padding : 0;
    let bottom = this.needsCustomBottomPadding() ? this.props.padding : 0;

    for (const config of this.visibleElements) {
      if (config.position == "top") {
        top += config.height;
      } else if (config.position == "bottom") {
        bottom += config.height;
      }
    }

    return {
      top: top,
      bottom: bottom,
    };
  }

  availableHeight() {
    return this.props.height - this.props.gridMinimumHeight;
  }

  selectElementsForVisibility(): EChartVisibleElementConfig[] {
    let remainingHeight = this.availableHeight();
    let index = 0;
    const count = this.props.layoutConfigs.length;

    const selectedElements: EChartVisibleElementConfig[] = [];

    while (index < count && remainingHeight > 0) {
      const elementConfig = this.props.layoutConfigs[index];

      if (elementConfig.minHeight <= remainingHeight) {
        remainingHeight -= elementConfig.minHeight;

        selectedElements.push({
          height: elementConfig.minHeight,
          minHeight: elementConfig.minHeight,
          maxHeight: elementConfig.maxHeight,
          position: elementConfig.position,
          elementName: elementConfig.elementName,
        });

        index = index + 1;
      } else {
        break;
      }
    }

    for (const elementConfig of selectedElements) {
      if (remainingHeight > 0) {
        const height = this.assignExtraHeightToElementConfig(
          remainingHeight,
          elementConfig,
        );

        remainingHeight -= height;
        elementConfig.height += height;
      } else {
        break;
      }
    }

    return selectedElements;
  }

  assignExtraHeightToElementConfig(
    remainingHeight: number,
    elementConfig: EChartElementLayoutParams,
  ) {
    const difference = elementConfig.maxHeight - elementConfig.minHeight;

    if (remainingHeight > difference) {
      return difference;
    } else {
      return remainingHeight;
    }
  }
}
