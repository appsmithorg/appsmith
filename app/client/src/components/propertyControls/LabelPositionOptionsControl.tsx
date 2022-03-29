import * as React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import { LabelPosition } from "components/constants";
import { replayHighlightClass } from "globalStyles/portals";
import { StyledButton, StyledButtonGroup } from "./LabelButton";

export interface LabelPositionOptionsControlProps extends ControlProps {
  propertyValue: LabelPosition | undefined;
  options: any[];
}

class LabelPositionOptionsControl extends BaseControl<
  LabelPositionOptionsControlProps
> {
  constructor(props: LabelPositionOptionsControlProps) {
    super(props);
  }

  static getControlType() {
    return "LABEL_POSITION_OPTIONS";
  }

  public render() {
    const { options, propertyValue } = this.props;

    return (
      <StyledButtonGroup className={replayHighlightClass} fill>
        {options.map((option: LabelPosition) => {
          const active =
            option === LabelPosition.Auto
              ? propertyValue === option || propertyValue === undefined
              : propertyValue === option;

          return (
            <StyledButton
              active={active}
              key={option}
              onClick={() => this.toggleOption(option)}
              text={option}
            />
          );
        })}
      </StyledButtonGroup>
    );
  }

  private toggleOption = (option: LabelPosition) => {
    this.updateProperty(this.props.propertyName, option);
  };
}

export default LabelPositionOptionsControl;
