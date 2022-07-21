import { render, screen } from "test/testUtils";
import React from "react";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import Group from "./group";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { reduxForm } from "redux-form";

let container: any = null;
const settings = [
  {
    id: "test",
    name: "test",
    label: "formGroup",
    helpText: "",
    subText: "",
    category: "test",
    controlType: SettingTypes.BUTTON,
    fieldName: "uneditable-field",
    formName: "UneditableField",
    value: "http://localhost",
  },
];

function renderComponent() {
  function GroupComponent() {
    return <Group category="test" name="test" settings={settings} />;
  }
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: SETTINGS_FORM_NAME,
    touchOnBlur: true,
  })(GroupComponent);

  render(<Parent />);
}

function getElements() {
  const textInput = screen.queryAllByTestId("admin-settings-group-text-input");
  const toggle = screen.queryAllByTestId("admin-settings-group-toggle");
  const link = screen.queryAllByTestId("admin-settings-group-link");
  const text = screen.queryAllByTestId("admin-settings-group-text");
  const button = screen.queryAllByTestId("admin-settings-group-button");
  const group = screen.queryAllByTestId("admin-settings-group");
  const tagInput = screen.queryAllByTestId("admin-settings-tag-input");
  const accordion = screen.queryAllByTestId("admin-settings-accordion");
  const uneditableField = screen.queryAllByTestId(
    "admin-settings-uneditable-field",
  );

  return {
    textInput,
    toggle,
    link,
    text,
    button,
    group,
    tagInput,
    accordion,
    uneditableField,
  };
}

describe("Group", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const group = screen.queryAllByTestId("admin-settings-group-wrapper");
    expect(group).toHaveLength(1);
  });

  it("is rendered for text input", () => {
    settings[0].controlType = SettingTypes.TEXTINPUT;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(1);
    expect(toggle).toHaveLength(0);
    expect(link).toHaveLength(0);
    expect(text).toHaveLength(0);
    expect(button).toHaveLength(0);
    expect(group).toHaveLength(0);
    expect(uneditableField).toHaveLength(0);
    expect(tagInput).toHaveLength(0);
    expect(accordion).toHaveLength(0);
  });

  it("is rendered for toggle", () => {
    settings[0].controlType = SettingTypes.TOGGLE;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(0);
    expect(toggle).toHaveLength(1);
    expect(link).toHaveLength(0);
    expect(text).toHaveLength(0);
    expect(button).toHaveLength(0);
    expect(group).toHaveLength(0);
    expect(uneditableField).toHaveLength(0);
    expect(tagInput).toHaveLength(0);
    expect(accordion).toHaveLength(0);
  });

  it("is rendered for link", () => {
    settings[0].controlType = SettingTypes.LINK;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(0);
    expect(toggle).toHaveLength(0);
    expect(link).toHaveLength(1);
    expect(text).toHaveLength(0);
    expect(button).toHaveLength(0);
    expect(group).toHaveLength(0);
    expect(uneditableField).toHaveLength(0);
    expect(tagInput).toHaveLength(0);
    expect(accordion).toHaveLength(0);
  });

  it("is rendered for text", () => {
    settings[0].controlType = SettingTypes.TEXT;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(0);
    expect(toggle).toHaveLength(0);
    expect(link).toHaveLength(0);
    expect(text).toHaveLength(1);
    expect(button).toHaveLength(0);
    expect(group).toHaveLength(0);
    expect(uneditableField).toHaveLength(0);
    expect(tagInput).toHaveLength(0);
    expect(accordion).toHaveLength(0);
  });

  it("is rendered for button", () => {
    settings[0].controlType = SettingTypes.BUTTON;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(0);
    expect(toggle).toHaveLength(0);
    expect(link).toHaveLength(0);
    expect(text).toHaveLength(0);
    expect(button).toHaveLength(1);
    expect(group).toHaveLength(0);
    expect(uneditableField).toHaveLength(0);
    expect(tagInput).toHaveLength(0);
    expect(accordion).toHaveLength(0);
  });

  it("is rendered for group", () => {
    settings[0].controlType = SettingTypes.GROUP;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(0);
    expect(toggle).toHaveLength(0);
    expect(link).toHaveLength(0);
    expect(text).toHaveLength(0);
    expect(button).toHaveLength(0);
    expect(group).toHaveLength(1);
    expect(uneditableField).toHaveLength(0);
    expect(tagInput).toHaveLength(0);
    expect(accordion).toHaveLength(0);
  });

  it("is rendered for uneditable field", () => {
    settings[0].controlType = SettingTypes.UNEDITABLEFIELD;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(0);
    expect(toggle).toHaveLength(0);
    expect(link).toHaveLength(0);
    expect(text).toHaveLength(0);
    expect(button).toHaveLength(0);
    expect(group).toHaveLength(0);
    expect(uneditableField).toHaveLength(1);
    expect(tagInput).toHaveLength(0);
    expect(accordion).toHaveLength(0);
  });

  it("is rendered for tag input", () => {
    settings[0].controlType = SettingTypes.TAGINPUT;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(0);
    expect(toggle).toHaveLength(0);
    expect(link).toHaveLength(0);
    expect(text).toHaveLength(0);
    expect(button).toHaveLength(0);
    expect(group).toHaveLength(0);
    expect(uneditableField).toHaveLength(0);
    expect(tagInput).toHaveLength(1);
    expect(accordion).toHaveLength(0);
  });

  it("is rendered for accordion", () => {
    settings[0].controlType = SettingTypes.ACCORDION;
    renderComponent();
    const {
      accordion,
      button,
      group,
      link,
      tagInput,
      text,
      textInput,
      toggle,
      uneditableField,
    } = getElements();
    expect(textInput).toHaveLength(0);
    expect(toggle).toHaveLength(0);
    expect(link).toHaveLength(0);
    expect(text).toHaveLength(0);
    expect(button).toHaveLength(0);
    expect(group).toHaveLength(0);
    expect(uneditableField).toHaveLength(0);
    expect(tagInput).toHaveLength(0);
    expect(accordion).toHaveLength(1);
  });
});
