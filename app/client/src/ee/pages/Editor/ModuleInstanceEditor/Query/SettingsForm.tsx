import React, { useEffect, useRef } from "react";
import equal from "fast-deep-equal/es6";
import { getFormValues, reduxForm } from "redux-form";
import type { InjectedFormProps } from "redux-form";

import ActionSettings from "pages/Editor/ActionSettings";
import { QUERY_MODULE_INSTANCE_SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import { useSelector } from "react-redux";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { Action } from "entities/Action";
import { klona } from "klona";

interface SettingsFormOwnProps<TValues> {
  moduleInstanceId: string;
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
  moduleInstanceId,
  onFormValuesChange,
  settings,
}: SettingsFormProps<TValues>) {
  const instanceRef = useRef(moduleInstanceId);
  const valuesRef = useRef(initialValues);
  const formValues = useSelector(
    (state) =>
      getFormValues(QUERY_MODULE_INSTANCE_SETTINGS_FORM_NAME)(state) as TValues,
    equal,
  );

  useEffect(() => {
    if (
      moduleInstanceId === instanceRef.current &&
      !equal(formValues, valuesRef.current)
    ) {
      valuesRef.current = klona(formValues);
      onFormValuesChange(
        formValues,
      ); /* on page load setting change triggers 3 API calls due to different payloads */
    }
    if (moduleInstanceId !== instanceRef.current) {
      instanceRef.current = moduleInstanceId;
    }
  }, [formValues, onFormValuesChange, moduleInstanceId, instanceRef.current]);

  return (
    <ActionSettings
      actionSettingsConfig={settings}
      formName={QUERY_MODULE_INSTANCE_SETTINGS_FORM_NAME}
    />
  );
}

export default reduxForm<Action, SettingsFormOwnProps<Action>>({
  form: QUERY_MODULE_INSTANCE_SETTINGS_FORM_NAME,
  enableReinitialize: true,
})(SettingsForm);
