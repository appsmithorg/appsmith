import { render } from "test/testUtils";
import React from "react";
import UneditableField from "./UneditableField";
import { REDIRECT_URL_FORM } from "constants/forms";
import { reduxForm } from "redux-form";

let container: any = null;
const setting = {
  id: "SETTING_UNEDITABLE_FIELD_ID",
  name: "SETTING_UNEDITABLE_FIELD_ID",
  category: "test category",
  helpText: "some helper text",
  label: "test label",
};

const clickHandler = jest.fn();

function renderComponent() {
  function UneditableFieldComponent() {
    return (
      <UneditableField
        disabled
        handleCopy={clickHandler}
        helperText={setting.helpText}
        iscopy={"true"}
        label={setting.label}
        name={"uneditable-field"}
      />
    );
  }
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: REDIRECT_URL_FORM,
    touchOnBlur: true,
  })(UneditableFieldComponent);

  render(<Parent />, {
    initialState: {
      form: {
        [REDIRECT_URL_FORM]: {
          values: {
            "uneditable-field": "value to be copied",
          },
        },
      },
    },
  });
}

describe("Uneditabled Field", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    window.prompt = jest.fn();
    const inputEl = document.querySelector("input");
    const value = `value to be copied`;
    expect(inputEl?.value).toBeDefined();
    expect(inputEl?.value).toEqual(value);
    expect(inputEl?.hasAttribute("disabled"));
    expect(inputEl?.hasAttribute("iscopy")).toEqual(true);
    const copyIcon = document.querySelector(".copy-icon") as HTMLElement;
    expect(copyIcon).toBeDefined();
    copyIcon?.click();
  });
});
