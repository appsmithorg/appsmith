import React from "react";
import { fireEvent, render } from "@testing-library/react";

import SelectButton, { SelectButtonProps } from "./SelectButton";

const defaultProps: SelectButtonProps = {
  disabled: false,
  displayText: "0",
  handleCancelClick: jest.fn(),
  spanRef: null,
  togglePopoverVisibility: jest.fn(),
  tooltipText: "",
  value: "0",
};

const renderComponent = (props: SelectButtonProps = defaultProps) => {
  return render(<SelectButton {...props} />);
};

describe("SelectButton", () => {
  it("should not clear value when disabled", () => {
    const { getByTestId, getByText } = renderComponent({
      ...defaultProps,
      disabled: true,
    });
    fireEvent.click(getByTestId("selectbutton.btn.cancel"));
    expect(defaultProps.handleCancelClick).not.toBeCalled();
    expect(getByText("0")).toBeTruthy();
  });

  it("should render correctly", () => {
    const { getByText } = renderComponent();
    expect(getByText("0")).toBeTruthy();
  });

  it("should trigger handleCancelClick method on cancel click", () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId("selectbutton.btn.cancel"));
    expect(defaultProps.handleCancelClick).toBeCalled();
  });

  it("should toggle popover visibility method on button click", () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId("selectbutton.btn.main"));
    expect(defaultProps.togglePopoverVisibility).toBeCalled();
  });
});
