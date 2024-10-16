import React, { useCallback, useState } from "react";
import {
  Button,
  Flex,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Switch,
  Text,
} from "@appsmith/ads";
import JSFunctionSettingsView, {
  type JSFunctionSettingsProps,
} from "./old/JSFunctionSettings";
import type { JSAction } from "entities/JSCollection";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { createMessage, JS_EDITOR_SETTINGS } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

interface Props {
  disabled: boolean;
  actions: JSAction[];
  onUpdateSettings: JSFunctionSettingsProps["onUpdateSettings"];
}

interface FunctionSettingsRowProps {
  action: JSAction;
  onUpdateSettings: JSFunctionSettingsProps["onUpdateSettings"];
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
      key={props.action.id}
      w="100%"
    >
      <Switch
        defaultSelected={JSON.parse(executeOnPageLoad)}
        isSelected={JSON.parse(executeOnPageLoad)}
        name={`execute-on-page-load-${props.action.id}`}
        onChange={onChange}
      >
        {props.action.name}
      </Switch>
    </Flex>
  );
};

export const JSFunctionSettings = (props: Props) => {
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  if (!isActionRedesignEnabled) {
    return (
      <JSFunctionSettingsView
        actions={props.actions}
        disabled={props.disabled}
        onUpdateSettings={props.onUpdateSettings}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Button
          isIconButton
          kind="secondary"
          size="sm"
          startIcon="settings-2-line"
        />
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverHeader isClosable>
          {createMessage(JS_EDITOR_SETTINGS.TITLE)}
        </PopoverHeader>
        <PopoverBody>
          <Flex flexDirection="column" gap="spaces-4" w="100%">
            <Text kind="heading-xs">
              {createMessage(JS_EDITOR_SETTINGS.ON_LOAD_TITLE)}
            </Text>
            {props.actions.map((action) => (
              <FunctionSettingRow
                action={action}
                key={action.id}
                onUpdateSettings={props.onUpdateSettings}
              />
            ))}
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
