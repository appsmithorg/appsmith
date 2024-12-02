import React from "react";
import type { ControlProps } from "./BaseControl";
import ComputeTablePropertyControlV2 from "./TableComputeValue";

export interface HTMLComputeTablePropertyControlProps extends ControlProps {
  defaultValue?: string;
}

class HTMLComputeTablePropertyControl extends ComputeTablePropertyControlV2 {
  render() {
    return (
      <ComputeTablePropertyControlV2
        {...this.props}
        additionalControlData={{
          ...this.props.additionalControlData,
          isExpectingHTML: true,
        }}
      />
    );
  }

  static getControlType() {
    return "HTML_TABLE_COMPUTE_VALUE";
  }
}

export default HTMLComputeTablePropertyControl;
