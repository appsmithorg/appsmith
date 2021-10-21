import FormTextField from "components/ads/formFields/TextField";
import { createMessage } from "constants/messages";
import React from "react";
import { FormGroup, SettingComponentProps } from "./Common";

export default function TextInput({ setting }: SettingComponentProps) {
  return (
    <FormGroup setting={setting}>
      <FormTextField
        name={setting.name || ""}
        placeholder={createMessage(() => setting.placeholder || "")}
        type={setting.controlSubType}
      />
    </FormGroup>
  );
}
