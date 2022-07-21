import { render, screen } from "test/testUtils";
import React from "react";
import "@testing-library/jest-dom";
import { SignupSuccess } from "./SignupSuccess";

const useSelector = jest.fn();
const values = {
  isSuperUser: true,
};
useSelector.mockReturnValue(values);

function renderComponent() {
  return render(<SignupSuccess />);
}

describe("SignupSuccess", () => {
  it("If we are intending to redirect do not show the signup form", () => {
    renderComponent();
    expect(screen.queryByTestId("welcome-page")).toBeNull();
  });
});
