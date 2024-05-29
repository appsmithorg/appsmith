import { render } from "test/testUtils";
import React from "react";
import type { SidebarButtonProps } from "./SidebarButton";
import SidebarButton from "./SidebarButton";
import { TopButtons } from "@appsmith/entities/IDE/constants";

const sidebarButtonProps: SidebarButtonProps = {
  icon: TopButtons[1].icon,
  onClick: () => {},
  selected: false,
  title: TopButtons[1].title,
  conditionIcon: "warning",
  tooltip: TopButtons[1].conditionTooltip,
};

describe("SidebarButton", () => {
  it("should render the warning icon incase the datasource list is empty", () => {
    const { container } = render(<SidebarButton {...sidebarButtonProps} />);

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
  });
});
