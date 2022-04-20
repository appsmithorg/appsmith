import { render, screen } from "test/testUtils";
import React from "react";
import {
  SettingTypes,
  SettingSubtype,
} from "@appsmith/pages/AdminSettings/config/types";
import Accordion from "./Accordion";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { reduxForm } from "redux-form";

let container: any = null;
const setting = {
  id: "SETTING_TOGGLE_ID",
  name: "SETTING_TOGGLE_ID",
  category: "test category",
  subCategory: "test sub category",
  controlType: SettingTypes.ACCORDION,
  label: "test accordion label",
  advanced: [
    {
      id: "SETTING_TEXT_INPUT_ID",
      name: "SETTING_TEXT_INPUT_ID",
      category: "test input category",
      subCategory: "test input sub category",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "test input label",
    },
  ],
};

function renderComponent() {
  function ToggleComponent() {
    return (
      <Accordion
        category={setting.category}
        label={setting.label}
        settings={setting.advanced}
        subCategory={setting.subCategory}
      />
    );
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
            [setting.advanced[0].id]: false,
          },
        },
      },
    },
  });
}

describe("Accordion", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    expect(screen.getAllByText(/test accordion label/)).toBeDefined();
    expect(document.querySelector("hr")).toBeDefined();
    expect(document.querySelector("[name='expand-more']")).toBeDefined();
    expect(screen.queryByTestId("admin-settings-group-wrapper")).toBeFalsy();
  });

  it("is open", () => {
    renderComponent();
    expect(document.querySelector("hr")).toBeDefined();
    expect(document.querySelector("[name='expand-more']")).toBeDefined();
    document.querySelector("hr")?.click();
    expect(document.querySelector("[name='expand-less']")).toBeDefined();
    expect(screen.queryByTestId("admin-settings-group-wrapper")).toBeDefined();
  });
});
