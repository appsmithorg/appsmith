import React from "react";

import userEvent from "@testing-library/user-event";
import { render } from "test/testUtils";

import { Condition } from "../../../enums";
import SidebarButton, { type SidebarButtonProps } from "./SidebarButton";

const sidebarButtonProps: SidebarButtonProps = {
  icon: "down-arrow",
  onClick: () => {},
  selected: false,
  title: "Test",
  urlSuffix: "/test",
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

  it("should call onClick with urlSuffix", async () => {
    const checkOnClick = {
      ...sidebarButtonProps,
      onClick: jest.fn(),
    };
    const { getByRole } = render(<SidebarButton {...checkOnClick} />);

    await userEvent.click(getByRole("button"));
    expect(checkOnClick.onClick).toHaveBeenCalledWith(checkOnClick.urlSuffix);
  });

  it("should not call onClick when button is already selected", async () => {
    const withSelected = {
      ...sidebarButtonProps,
      selected: true,
      onClick: jest.fn(),
    };
    const { getByRole } = render(<SidebarButton {...withSelected} />);

    await userEvent.click(getByRole("button"));
    expect(withSelected.onClick).not.toHaveBeenCalled();
  });
});
