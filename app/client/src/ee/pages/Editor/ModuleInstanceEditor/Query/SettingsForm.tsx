import React, { useEffect, useRef } from "react";
import equal from "fast-deep-equal/es6";
import { getFormValues, reduxForm } from "redux-form";
import type { InjectedFormProps } from "redux-form";

import ActionSettings from "pages/Editor/ActionSettings";
import { QUERY_MODULE_INSTANCE_SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import { useSelector } from "react-redux";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { Action } from "entities/Action";

interface SettingsFormOwnProps<TValues> {
  settings: Module["settingsForm"];
  onFormValuesChange: (formValues: TValues) => void;
}

type SettingsFormProps<TValues> = InjectedFormProps<
  TValues,
  SettingsFormOwnProps<TValues>
> &
  SettingsFormOwnProps<TValues>;

function SettingsForm<TValues>({
  initialValues,
  onFormValuesChange,
  settings,
}: SettingsFormProps<TValues>) {
  const valuesRef = useRef(initialValues);
  const formValues = useSelector(
    (state) =>
      getFormValues(QUERY_MODULE_INSTANCE_SETTINGS_FORM_NAME)(state) as TValues,
    equal,
  );

  useEffect(() => {
    if (!equal(formValues, valuesRef.current)) {
      onFormValuesChange(formValues);
    }
  }, [formValues, onFormValuesChange]);

  return (
    <ActionSettings
      actionSettingsConfig={settings}
      formName={QUERY_MODULE_INSTANCE_SETTINGS_FORM_NAME}
    />
  );
}

export default reduxForm<Action, SettingsFormOwnProps<Action>>({
  form: QUERY_MODULE_INSTANCE_SETTINGS_FORM_NAME,
  enableReinitialize: false,
})(SettingsForm);
