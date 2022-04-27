import { render } from "test/testUtils";
import React from "react";
import {
  SettingTypes,
  SettingSubtype,
} from "@appsmith/pages/AdminSettings/config/types";
import TextInput from "./TextInput";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { reduxForm } from "redux-form";

let container: any = null;
const setting = {
  id: "SETTING_TEXT_INPUT_ID",
  name: "SETTING_TEXT_INPUT_ID",
  category: "test category",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "test label",
};

function renderComponent() {
  function TextInputFieldComponent() {
    return <TextInput setting={setting} />;
  }
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: SETTINGS_FORM_NAME,
    touchOnBlur: true,
  })(TextInputFieldComponent);

  render(<Parent />, {
    initialState: {
      form: {
        [SETTINGS_FORM_NAME]: {
          values: {
            [setting.id]: "test value",
          },
        },
      },
    },
  });
}

describe("Text Input", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const inputEl = document.querySelector("input");
    expect(inputEl?.value).toBeDefined();
    expect(inputEl?.value).toEqual("test value");
  });
});
