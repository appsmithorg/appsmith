import FormTextField from "components/utils/ReduxFormTextField";
import { createMessage } from "@appsmith/constants/messages";
import React from "react";
import type { SettingComponentProps } from "./Common";

export default function TextInput({ setting }: SettingComponentProps) {
  return (
    <div
      className={`t--admin-settings-text-input t--admin-settings-${
        setting.name || setting.id
      } mb-4`}
    >
      <FormTextField
        description={setting.subText || ""}
        isRequired={setting.isRequired}
        label={setting.label || ""}
        name={setting.name || setting.id || ""}
        placeholder={createMessage(() => setting.placeholder || "")}
        type={setting.controlSubType}
      />
    </div>
  );
}
