import React from "react";
import { Alignment } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ControlIcons } from "icons/ControlIcons";
import { replayHighlightClass } from "globalStyles/portals";
import { StyledButton, StyledButtonGroup } from "./LabelButton";

export interface LabelAlignmentOptionsControlProps extends ControlProps {
  propertyValue: Alignment | undefined;
}

class LabelAlignmentOptionsControl extends BaseControl<
  LabelAlignmentOptionsControlProps
> {
  static getControlType() {
    return "LABEL_ALIGNMENT_OPTIONS";
  }

  public render() {
    const { propertyValue } = this.props;

    return (
      <StyledButtonGroup className={replayHighlightClass} fill>
        <StyledButton
          active={
            propertyValue === Alignment.LEFT || propertyValue === undefined
          }
          icon={<ControlIcons.LEFT_ALIGN color="#979797" />}
          onClick={this.handleAlign(Alignment.LEFT)}
        />
        <StyledButton
          active={propertyValue === Alignment.RIGHT}
          icon={<ControlIcons.RIGHT_ALIGN color="#979797" />}
          onClick={this.handleAlign(Alignment.RIGHT)}
        />
      </StyledButtonGroup>
    );
  }

  private handleAlign(align: Alignment) {
    return () => {
      this.updateProperty(this.props.propertyName, align);
    };
  }
}

export default LabelAlignmentOptionsControl;
