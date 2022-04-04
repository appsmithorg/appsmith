import { render, screen } from "test/testUtils";
import React from "react";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import TagInputField from "./TagInputField";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { reduxForm } from "redux-form";

let container: any = null;
const setting = {
  id: "SETTING_TAG_INPUT_ID",
  name: "SETTING_TAG_INPUT_ID",
  category: "test category",
  controlType: SettingTypes.TAGINPUT,
  label: "test label",
};

function renderComponent() {
  function TagInputFieldComponent() {
    return (
      <TagInputField
        data-cy="t--tag-input"
        intent="success"
        label={setting.label}
        name={setting.name || setting.id}
        placeholder=""
        setting={setting}
        type="text"
      />
    );
  }
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: SETTINGS_FORM_NAME,
    touchOnBlur: true,
  })(TagInputFieldComponent);

  render(<Parent />, {
    initialState: {
      form: {
        [SETTINGS_FORM_NAME]: {
          values: {
            [setting.id]: "comma,separated,values",
          },
        },
      },
    },
  });
}

describe("Tag Input", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const allTags = document.getElementsByClassName(
      "bp3-text-overflow-ellipsis",
    );
    const allCrossBtns = document.getElementsByClassName("bp3-tag-remove");
    const numberOfTags = allTags.length;
    const numberOfCrossBtns = allCrossBtns.length;
    expect(numberOfTags).toEqual(numberOfCrossBtns);
    expect(screen.getByText(/comma/)).toBeDefined();
    expect(screen.getByText(/separated/)).toBeDefined();
    expect(screen.getByText(/values/)).toBeDefined();
  });
});
