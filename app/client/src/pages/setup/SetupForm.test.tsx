import { fireEvent, render, screen } from "test/testUtils";
import React from "react";
import "@testing-library/jest-dom";
import SetupForm from "./SetupForm";
import userEvent from "@testing-library/user-event";

function renderComponent() {
  return render(<SetupForm />);
}

describe("SetupForm", () => {
  it("If the form is in invalid state pressing enter should not submit the form", async () => {
    renderComponent();
    const verifyPassword = screen.getByTestId("verifyPassword");
    const formPage = screen.getByTestId("formPage");

    expect(verifyPassword).toHaveAttribute("name");
    await userEvent.keyboard("{enter}");
    // This attribute is removed in onsubmit
    expect(verifyPassword).toHaveAttribute("name");
    expect(formPage).toHaveClass("block");
  });
  it("If the form is in valid state pressing enter should nagivate to next page", async () => {
    renderComponent();
    const formPage = screen.getByTestId("formPage");

    expect(formPage).toHaveClass("block");
    const firstName = screen.getByTestId("firstName");

    fireEvent.change(firstName, { target: { value: "John" } });
    const lastName = screen.getByTestId("lastName");

    fireEvent.change(lastName, { target: { value: "Doe" } });
    const email = screen.getByTestId("email");

    fireEvent.change(email, { target: { value: "john.doe@test.com" } });
    const password = screen.getByTestId("password");

    fireEvent.change(password, { target: { value: "Test@123" } });
    const verifyPassword = screen.getByTestId("verifyPassword");

    fireEvent.change(verifyPassword, { target: { value: "Test@123" } });
    await userEvent.keyboard("{enter}");
    expect(formPage).toHaveClass("hidden");
  });
});
