import React from "react";
import { FormGroup, SettingComponentProps } from "./Common";
import SelectField from "components/editorComponents/form/fields/SelectField";

export default function DropDown(
  props: {
    dropdownOptions: Array<{ id: string; value: string; label?: string }>;
  } & SettingComponentProps,
) {
  const { dropdownOptions, setting } = props;

  return (
    <FormGroup
      className={`t--admin-settings-dropdown t--admin-settings-${setting.name ||
        setting.id}`}
      setting={setting}
    >
      <SelectField
        fillOptions
        name={setting.id}
        options={dropdownOptions}
        outline={false}
        placeholder="Select an option"
        size="large"
      />
    </FormGroup>
  );
}
