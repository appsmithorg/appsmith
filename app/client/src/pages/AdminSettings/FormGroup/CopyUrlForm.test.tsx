import { render, screen } from "test/testUtils";
import React from "react";
import CopyUrlForm from "./CopyUrlForm";
import copy from "copy-to-clipboard";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;

jest.mock("copy-to-clipboard");

const values = {
  helpText: "some helper text",
  title: "Redirect URL",
  value: "/link-to-be-copied",
  fieldName: "redirectUrl",
};

function renderComponent() {
  render(
    <CopyUrlForm
      fieldName={values.fieldName}
      helpText={values.helpText}
      title={values.title}
      value={values.value}
    />,
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
    const inputEl = screen.getByTestId(
      `${values.fieldName}-input`,
    ) as HTMLInputElement;
    const value = `${window.location.origin}/link-to-be-copied`;

    expect(inputEl?.value).toBeDefined();
    expect(inputEl?.value).toEqual(value);
    expect(inputEl?.hasAttribute("disabled"));
    const copyIcon = screen.getByTestId("redirectUrl-copy-icon");

    expect(copyIcon).toBeDefined();
    copyIcon?.click();
    expect(copy).toHaveBeenCalledWith(value);
    inputEl?.click();
    expect(copy).toHaveBeenCalledWith(value);
  });
});
