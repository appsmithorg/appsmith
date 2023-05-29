import React, { useState } from "react";
import type { SegmentedControlOption } from "design-system";
import { SegmentedControl } from "design-system";

function CanvasCodeSwitcher() {
  const options: SegmentedControlOption[] = [
    {
      label: "Canvas",
      value: "CANVAS",
    },
    {
      label: "Code",
      value: "CODE",
    },
  ];
  const [switcher, setSwitcher] = useState("CANVAS");

  return (
    <SegmentedControl
      onChange={setSwitcher}
      options={options}
      value={switcher}
    />
  );
}

export default CanvasCodeSwitcher;
