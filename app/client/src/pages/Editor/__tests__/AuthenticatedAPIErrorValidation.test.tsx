import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import userEvent from "@testing-library/user-event";
import FormControl from "../FormControl";
import { createMessage, INVALID_URL } from "ee/constants/messages";
import FormControlRegistry from "utils/formControl/FormControlRegistry";
import { reduxForm } from "redux-form";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;

const urlValidator = (value: string) => {
  const validationRegex = "^(http|https)://";
  if (value) {
    const regex = new RegExp(validationRegex);

    return regex.test(value)
      ? { isValid: true, message: "" }
      : {
          isValid: false,
          message: createMessage(INVALID_URL),
        };
  }

  return { isValid: true, message: "" };
};

function renderComponent() {
  function formControlComponent() {
    return (
      <FormControl
        config={{
          id: "",
          isValid: false,
          isRequired: true,
          controlType: "INPUT_TEXT",
          dataType: "TEXT",
          configProperty: "authentication.accessTokenUrl",
          encrypted: false,
          label: "Access token URL",
          conditionals: {},
          placeholderText: "https://example.com/login/oauth/access_token",
          formName: "DatasourceRestAPIForm",
          validator: urlValidator,
        }}
        formName="DatasourceRestAPIForm"
        multipleConfig={[]}
      />
    );
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: "DatasourceRestAPIForm",
    touchOnBlur: true,
  })(formControlComponent);

  render(<Parent />);
}

describe("Authenticated API URL validations", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    FormControlRegistry.registerFormControlBuilders();
  });

  it("enter invalid token url and check for errors", async () => {
    renderComponent();
    const inputFormControl = document.querySelectorAll(
      ".t--form-control-INPUT_TEXT",
    );
    expect(inputFormControl.length).toBe(1);

    const inputBox = inputFormControl[0].querySelectorAll("input");
    expect(inputBox.length).toBe(1);

    await userEvent.type(inputBox[0], "test value");
    expect(inputBox[0]).toHaveValue("test value");

    const errorText = screen.getAllByText(
      "Please enter a valid URL, for example, https://example.com",
    );
    expect(errorText).toBeDefined();
  });

  it("enter valid token url and check for errors", async () => {
    renderComponent();
    const inputFormControl = document.querySelectorAll(
      ".t--form-control-INPUT_TEXT",
    );
    expect(inputFormControl.length).toBe(1);

    const inputBox = inputFormControl[0].querySelectorAll("input");
    expect(inputBox.length).toBe(1);

    await userEvent.type(inputBox[0], "https://example.com");
    expect(inputBox[0]).toHaveValue("https://example.com");

    const errorText = screen.queryAllByText(
      "Please enter a valid URL, for example, https://example.com",
    );
    expect(errorText.length).toBe(0);
  });
});
