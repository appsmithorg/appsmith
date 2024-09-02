import FormTextField from "components/utils/ReduxFormTextField";
import { createMessage } from "ee/constants/messages";
import React from "react";
import { FormGroup, type SettingComponentProps } from "./Common";

export default function TextInput({ setting }: SettingComponentProps) {
  return (
    <FormGroup
      className={`t--admin-settings-text-input t--admin-settings-${
        setting.name || setting.id
      } mb-4`}
      setting={setting}
    >
      <FormTextField
        defaultValue={setting.value}
        disabled={setting.isFeatureEnabled === false}
        format={setting.format}
        isRequired={setting.isRequired}
        name={setting.name || setting.id || ""}
        parse={setting.parse}
        placeholder={createMessage(() => setting.placeholder || "")}
        type={setting.controlSubType}
      />
    </FormGroup>
  );
}
