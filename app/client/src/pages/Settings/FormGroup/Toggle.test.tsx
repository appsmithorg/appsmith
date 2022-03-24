import { render } from "test/testUtils";
import React from "react";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import Toggle from "./Toggle";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { reduxForm } from "redux-form";

let container: any = null;
const setting = {
  id: "SETTING_TOGGLE_ID",
  name: "SETTING_TOGGLE_ID",
  category: "test category",
  controlType: SettingTypes.TOGGLE,
  label: "test label",
};

function renderComponent() {
  function ToggleComponent() {
    return <Toggle setting={setting} />;
  }
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: SETTINGS_FORM_NAME,
    touchOnBlur: true,
  })(ToggleComponent);

  render(<Parent />, {
    initialState: {
      form: {
        [SETTINGS_FORM_NAME]: {
          values: {
            [setting.id]: false,
          },
        },
      },
    },
  });
}

describe("Toggle", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const inputEl = document.querySelector("input");
    expect(inputEl?.value).toBeDefined();
    expect(inputEl?.value).toEqual("true"); // value = ![setting.id]
    expect(inputEl?.hasAttribute("checked"));
  });

  it("when clicked flips the flag", () => {
    renderComponent();
    const inputEl = document.querySelector("input");
    inputEl?.click();
    expect(inputEl?.value).toEqual("false");
  });
});
