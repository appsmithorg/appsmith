import { render } from "test/testUtils";
import React from "react";
import { Condition } from "./SidebarButton";
import SidebarButton from "./SidebarButton";
import { TopButtons } from "@appsmith/entities/IDE/constants";

const sidebarButtonProps = {
  icon: TopButtons[1].icon,
  onClick: () => {},
  selected: false,
  title: TopButtons[1].title,
  condition: Condition.Warn,
};

describe("SidebarButton", () => {
  it("should render the warning icon in case the datasource list is empty", () => {
    const { container } = render(<SidebarButton {...sidebarButtonProps} />);

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
  });
});
