import React from "react";
import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";
import SelectField from "components/editorComponents/form/fields/SelectField";
import type { SelectOptionProps } from "@appsmith/ads";

export default function DropDown(
  props: {
    dropdownOptions: Partial<SelectOptionProps>[];
  } & SettingComponentProps,
) {
  const { dropdownOptions, setting } = props;

  return (
    <FormGroup
      className={`t--admin-settings-dropdown t--admin-settings-${
        setting.name || setting.id
      }`}
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
