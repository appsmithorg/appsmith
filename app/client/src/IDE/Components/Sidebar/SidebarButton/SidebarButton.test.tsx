import { render } from "test/testUtils";
import React from "react";
import SidebarButton, { type SidebarButtonProps } from "./SidebarButton";

import { Condition } from "../../../enums";

const sidebarButtonProps: SidebarButtonProps = {
  icon: "down-arrow",
  onClick: () => {},
  selected: false,
  title: "Test",
};

describe("SidebarButton", () => {
  it("should render the warning icon in case the datasource list is empty", () => {
    const withWarningCondition = {
      ...sidebarButtonProps,
      condition: Condition.Warn,
    };

    const { container } = render(<SidebarButton {...withWarningCondition} />);

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
  });
});
