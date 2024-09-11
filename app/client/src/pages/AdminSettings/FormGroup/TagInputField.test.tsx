import { render, screen } from "test/testUtils";
import React from "react";
import type { Setting } from "ee/pages/AdminSettings/config/types";
import { SettingTypes } from "ee/pages/AdminSettings/config/types";
import TagInputField from "./TagInputField";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { reduxForm } from "redux-form";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;
const setting: Setting = {
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
        data-testid="t--tag-input"
        intent="success"
        label={setting.label}
        name={setting.name || setting.id}
        placeholder=""
        setting={setting}
        type="text"
      />
    );
  }
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
