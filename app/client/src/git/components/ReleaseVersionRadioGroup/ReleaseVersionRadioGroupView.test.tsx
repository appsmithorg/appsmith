import React from "react";
import { render, fireEvent } from "@testing-library/react";
import ReleaseVersionRadioGroupView from "./ReleaseVersionRadioGroupView";
import "@testing-library/jest-dom";

describe("ReleaseVersionRadioGroupView", () => {
  const mockOnVersionChange = jest.fn();

  const renderComponent = (props = {}) => {
    return render(
      <ReleaseVersionRadioGroupView
        latestReleaseVersion="1.0.0"
        onVersionChange={mockOnVersionChange}
        releasedAt="2023-01-01"
        {...props}
      />,
    );
  };

  beforeEach(() => {
    mockOnVersionChange.mockClear();
  });

  it("should render correctly with initial props", () => {
    const { getByRole, getByTestId } = renderComponent();

    expect(getByTestId("t--git-release-version-title").textContent).toBe(
      "Version",
    );
    expect(getByTestId("t--git-release-next-version").textContent).toBe(
      "1.0.1",
    );
    expect(getByTestId("t--git-release-released-at").textContent).toBe(
      "Last released: 1.0.0 (2023-01-01)",
    );
    expect(getByRole("radio", { name: /patch/i })).toBeChecked();
  });

  it("should change version when a different radio button is selected", () => {
    const { getByRole, getByTestId } = renderComponent();

    fireEvent.click(getByRole("radio", { name: /minor/i }));
    expect(getByTestId("t--git-release-next-version").textContent).toBe(
      "1.1.0",
    );
    fireEvent.click(getByRole("radio", { name: /major/i }));
    expect(getByTestId("t--git-release-next-version").textContent).toBe(
      "2.0.0",
    );
  });

  it("should call onVersionChange with the correct version", () => {
    const { getByRole } = renderComponent();

    expect(mockOnVersionChange).toHaveBeenCalledWith("1.0.1"); // initial call with patch version
    fireEvent.click(getByRole("radio", { name: /minor/i }));
    expect(mockOnVersionChange).toHaveBeenCalledWith("1.1.0");
    fireEvent.click(getByRole("radio", { name: /major/i }));
    expect(mockOnVersionChange).toHaveBeenCalledWith("2.0.0");
  });

  it("should handle null values for latestReleaseVersion and releasedAt", () => {
    const { queryByTestId } = renderComponent({
      latestReleaseVersion: null,
      releasedAt: null,
    });

    expect(queryByTestId("t--git-release-released-at")).not.toBeInTheDocument();
  });
});
