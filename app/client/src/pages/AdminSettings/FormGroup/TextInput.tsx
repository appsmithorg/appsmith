import FormTextField from "components/utils/ReduxFormTextField";
import { createMessage } from "@appsmith/constants/messages";
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
        disabled={setting.isFeatureEnabled === false}
        isRequired={setting.isRequired}
        name={setting.name || setting.id || ""}
        placeholder={createMessage(() => setting.placeholder || "")}
        type={setting.controlSubType}
      />
    </FormGroup>
  );
}
