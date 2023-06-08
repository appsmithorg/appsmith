import React from "react";
import { IconWrapper } from "@design-system/widgets-old";
import { fireEvent, render } from "@testing-library/react";

import type { SelectButtonProps } from "./SelectButton";
import SelectButton from "./SelectButton";

// It is necessary to make a mock of the Icon component as the error falls due to React.lazy in importIconImpl
jest.mock("@design-system/widgets-old", () => {
  const originalModule = jest.requireActual("@design-system/widgets-old");
  return {
    __esModule: true,
    ...originalModule,
    Icon: (props: any) => {
      return <IconWrapper {...props} />;
    },
  };
});

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
  it("should not fire click event when disabled", () => {
    const { getByTestId, getByText } = renderComponent({
      ...defaultProps,
      disabled: true,
    });
    fireEvent.click(getByTestId("selectbutton.btn.main"));
    expect(defaultProps.togglePopoverVisibility).not.toBeCalled();
    expect(getByText("0")).toBeTruthy();
  });

  it("should render correctly", async () => {
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
