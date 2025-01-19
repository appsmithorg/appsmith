import { render, screen } from "@testing-library/react";
import React from "react";
import { SidebarButton } from "./SidebarButton";

import { Condition } from "../enums";
import userEvent from "@testing-library/user-event";
import type { SidebarButtonProps } from "./SidebarButton.types";

const sidebarButtonProps: SidebarButtonProps = {
  icon: "down-arrow",
  onClick: () => {},
  selected: false,
  title: "Test",
  urlSuffix: "/test",
  testId: "testId",
};

describe("SidebarButton", () => {
  it("should render the button with the correct test id", () => {
    render(<SidebarButton {...sidebarButtonProps} />);

    expect(screen.getByTestId("t--sidebar-testId")).toBeDefined();
  });

  it("should render the warning icon in case the datasource list is empty", () => {
    const withWarningCondition = {
      ...sidebarButtonProps,
      condition: Condition.Warn,
    };

    render(<SidebarButton {...withWarningCondition} />);
    const conditionIcon = screen.getByTestId("t--sidebar-Warn-condition-icon");

    expect(conditionIcon).toBeInTheDocument();
  });

  it("should call onClick with urlSuffix", async () => {
    const checkOnClick = {
      ...sidebarButtonProps,
      onClick: jest.fn(),
    };

    render(<SidebarButton {...checkOnClick} />);

    await userEvent.click(screen.getByRole("button"));
    expect(checkOnClick.onClick).toHaveBeenCalledWith(checkOnClick.urlSuffix);
  });

  it("should not call onClick when button is already selected", async () => {
    const withSelected = {
      ...sidebarButtonProps,
      selected: true,
      onClick: jest.fn(),
    };

    render(<SidebarButton {...withSelected} />);

    await userEvent.click(screen.getByRole("button"));
    expect(withSelected.onClick).not.toHaveBeenCalled();
  });
});
