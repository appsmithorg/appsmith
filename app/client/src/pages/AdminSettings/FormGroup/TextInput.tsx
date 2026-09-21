import FormTextField from "components/utils/ReduxFormTextField";
import { createMessage } from "ee/constants/messages";
import React from "react";
import { FormGroup, type SettingComponentProps } from "./Common";
import { getFormValues } from "redux-form";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { useSelector } from "react-redux";

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export default function TextInput({ setting }: SettingComponentProps) {
  const settings = useSelector(formValuesSelector);
  const isDisabled =
    setting.isFeatureEnabled === false ||
    setting.isReadOnly === true ||
    Boolean(setting.isDisabled && setting.isDisabled(settings));

  return (
    <FormGroup
      className={`t--admin-settings-text-input t--admin-settings-${
        setting.name || setting.id
      } mb-4`}
      setting={setting}
    >
      <FormTextField
        defaultValue={setting.value}
        disabled={isDisabled}
        format={setting.format}
        isRequired={setting.isRequired}
        name={setting.name || setting.id || ""}
        parse={setting.parse}
        placeholder={createMessage(() => setting.placeholder || "")}
        postfix={setting.postfix}
        type={setting.controlSubType}
      />
    </FormGroup>
  );
}
