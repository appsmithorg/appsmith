import React, { useCallback, useState } from "react";
import { Flex, Switch, Text } from "@appsmith/ads";
import type { JSAction } from "entities/JSCollection";
import {
  createMessage,
  JS_EDITOR_SETTINGS,
  NO_JS_FUNCTIONS,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { OnUpdateSettingsProps } from "../types";

interface Props {
  disabled: boolean;
  actions: JSAction[];
  onUpdateSettings: (props: OnUpdateSettingsProps) => void;
}

interface FunctionSettingsRowProps extends Omit<Props, "actions"> {
  action: JSAction;
}

const FunctionSettingRow = (props: FunctionSettingsRowProps) => {
  const [executeOnPageLoad, setExecuteOnPageLoad] = useState(
    String(props.action.executeOnLoad),
  );

  const onChange = useCallback(
    (isSelected: boolean) => {
      const value = String(isSelected);

      setExecuteOnPageLoad(value);
      props.onUpdateSettings?.({
        value: value === "true",
        propertyName: "executeOnLoad",
        action: props.action,
      });

      AnalyticsUtil.logEvent("JS_OBJECT_SETTINGS_CHANGED", {
        toggleSetting: "ON_PAGE_LOAD",
        toggleValue: value,
      });
    },
    [props],
  );

  return (
    <Flex
      className={`t--async-js-function-settings ${props.action.name}-on-page-load-setting`}
      gap="spaces-4"
      id={`${props.action.name}-settings`}
      key={props.action.id}
      w="100%"
    >
      <Switch
        defaultSelected={JSON.parse(executeOnPageLoad)}
        isDisabled={props.disabled}
        isSelected={JSON.parse(executeOnPageLoad)}
        name={`execute-on-page-load-${props.action.id}`}
        onChange={onChange}
      >
        {props.action.name}
      </Switch>
    </Flex>
  );
};

/**
 * JSFunctionSettings component renders a button and a popover for configuring JS function settings.
 * It conditionally renders the old or new version of the component based on a feature flag.
 */
export const JSFunctionSettings = (props: Props) => {
  return (
    <Flex flexDirection="column" gap="spaces-4" w="100%">
      <Text kind="heading-xs">
        {createMessage(JS_EDITOR_SETTINGS.ON_LOAD_TITLE)}
      </Text>
      {props.actions.map((action) => (
        <FunctionSettingRow
          action={action}
          disabled={props.disabled}
          key={action.id}
          onUpdateSettings={props.onUpdateSettings}
        />
      ))}
      {props.actions.length === 0 && (
        <Text kind="body-s">{createMessage(NO_JS_FUNCTIONS)}</Text>
      )}
    </Flex>
  );
};
