import { render, screen } from "test/testUtils";
import React from "react";
import "@testing-library/jest-dom";
import SetupForm from "./SetupForm";
import userEvent from "@testing-library/user-event";

function renderComponent() {
  return render(<SetupForm />);
}

describe("SetupForm", () => {
  it("If the form is in invalid state pressing enter should not submit the form", () => {
    renderComponent();
    const verifyPassword = screen.getByTestId("verifyPassword");
    expect(verifyPassword).toHaveAttribute("name");
    userEvent.keyboard("{enter}");
    // This attribute is removed in onsubmit
    expect(verifyPassword).toHaveAttribute("name");
  });
});
