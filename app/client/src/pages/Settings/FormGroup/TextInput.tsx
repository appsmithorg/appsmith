import FormTextField from "components/utils/ReduxFormTextField";
import { createMessage } from "@appsmith/constants/messages";
import React from "react";
import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";

export default function TextInput({ setting }: SettingComponentProps) {
  return (
    <FormGroup
      className={`t--admin-settings-text-input t--admin-settings-${
        setting.name || setting.id
      }`}
      setting={setting}
    >
      <FormTextField
        name={setting.name || setting.id || ""}
        placeholder={createMessage(() => setting.placeholder || "")}
        type={setting.controlSubType}
      />
    </FormGroup>
  );
}
