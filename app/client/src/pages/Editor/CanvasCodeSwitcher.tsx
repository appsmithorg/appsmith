import React, { useState } from "react";
import type { SegmentedControlOption } from "design-system";
import { SegmentedControl } from "design-system";
import history from "utils/history";
import { builderURL } from "RouteBuilder";

type CanvasCodeSwitcherProps = {
  pageId: string;
};

function CanvasCodeSwitcher(props: CanvasCodeSwitcherProps) {
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

  const onChange = (value: string) => {
    if (value === "CANVAS") {
      history.push(
        builderURL({
          pageId: props.pageId,
        }),
      );
    }

    setSwitcher(value);
  };

  return (
    <SegmentedControl onChange={onChange} options={options} value={switcher} />
  );
}

export default CanvasCodeSwitcher;
