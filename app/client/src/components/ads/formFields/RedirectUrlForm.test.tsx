import { render, screen } from "test/testUtils";
import React from "react";
import { RedirectUrlReduxForm } from "./RedirectUrlForm";

let container: any = null;

const useSelector = jest.fn();
const values = {
  helpText: "some helper text",
  value: "/link-to-be-copied",
};
useSelector.mockReturnValue(values);

function renderComponent() {
  render(
    <RedirectUrlReduxForm helpText={values.helpText} value={values.value} />,
  );
}

describe("Redirect URL Form", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    window.prompt = jest.fn();
    const fieldTitle = screen.getAllByText(/Redirect URL/);
    expect(fieldTitle).toBeDefined();
    const inputEl = document.querySelector("input");
    const value = `${window.location.origin}/link-to-be-copied`;
    expect(inputEl?.value).toBeDefined();
    expect(inputEl?.value).toEqual(value);
    expect(inputEl?.hasAttribute("disabled"));
    expect(inputEl?.hasAttribute("iscopy")).toEqual(true);
    const copyIcon = document.querySelector(".copy-icon") as HTMLElement;
    expect(copyIcon).toBeDefined();
    copyIcon?.click();
  });
});
