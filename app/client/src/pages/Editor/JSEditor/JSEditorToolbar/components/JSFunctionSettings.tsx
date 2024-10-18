import React, { useCallback, useState } from "react";
import { Flex, Switch, Text } from "@appsmith/ads";
import JSFunctionSettingsView, {
  type JSFunctionSettingsProps,
} from "./old/JSFunctionSettings";
import type { JSAction } from "entities/JSCollection";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { createMessage, JS_EDITOR_SETTINGS } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { ToolbarSettingsPopover } from "IDE";

interface Props {
  disabled: boolean;
  actions: JSAction[];
  onUpdateSettings: JSFunctionSettingsProps["onUpdateSettings"];
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
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  const [isOpen, setIsOpen] = useState(false);

  // If the feature flag is disabled, render the old version of the component
  if (!isActionRedesignEnabled) {
    return (
      <JSFunctionSettingsView
        actions={props.actions}
        disabled={props.disabled}
        onUpdateSettings={props.onUpdateSettings}
      />
    );
  }

  // Render the new version of the component
  return (
    <ToolbarSettingsPopover
      handleOpenChange={setIsOpen}
      isOpen={isOpen}
      title={createMessage(JS_EDITOR_SETTINGS.TITLE)}
    >
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
      </Flex>
    </ToolbarSettingsPopover>
  );
};
