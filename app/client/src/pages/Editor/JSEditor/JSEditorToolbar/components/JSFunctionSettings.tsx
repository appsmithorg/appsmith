import React, { useCallback, useState } from "react";
import {
  Flex,
  Option,
  Select,
  Text,
  type SelectOptionProps,
} from "@appsmith/ads";
import type { JSAction } from "entities/JSCollection";
import {
  createMessage,
  JS_EDITOR_SETTINGS,
  NO_JS_FUNCTIONS,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { OnUpdateSettingsProps } from "../types";
import {
  ActionRunBehaviour,
  type ActionRunBehaviourType,
} from "PluginActionEditor/types/PluginActionTypes";
import styled from "styled-components";
import { RUN_BEHAVIOR_VALUES } from "constants/AppsmithActionConstants/formConfig/PluginSettings";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

const OptionLabel = styled(Text)`
  color: var(--ads-v2-color-fg);
  font-size: 14px;
  font-weight: 500;
`;

const OptionSubText = styled(Text)`
  color: var(--ads-v2-color-fg-muted);
  font-size: 12px;
`;

const StyledSelect = styled(Select)`
  width: fit-content;

  .rc-select-selector {
    min-width: 110px;
  }
`;

const FunctionName = styled(Text)`
  word-break: break-all;
`;

interface Props {
  disabled: boolean;
  actions: JSAction[];
  onUpdateSettings: (props: OnUpdateSettingsProps) => void;
}

interface FunctionSettingsRowProps extends Omit<Props, "actions"> {
  action: JSAction;
}

const FunctionSettingRow = (props: FunctionSettingsRowProps) => {
  const [runBehaviour, setRunBehaviour] = useState(props.action.runBehaviour);
  const isReactiveActionsEnabled = useFeatureFlag(
    FEATURE_FLAG.release_reactive_actions_enabled,
  );
  const options = RUN_BEHAVIOR_VALUES.filter(
    (option) =>
      isReactiveActionsEnabled || option.value !== ActionRunBehaviour.AUTOMATIC,
  ) as SelectOptionProps[];
  let selectedValue = options.find((opt) => opt.value === runBehaviour);

  /* temporary check added to switch from automatic to page load as the run behaviour when feature flag is turned off */
  if (
    runBehaviour === ActionRunBehaviour.AUTOMATIC &&
    !isReactiveActionsEnabled
  ) {
    selectedValue = options.find(
      (opt) => opt.value === ActionRunBehaviour.ON_PAGE_LOAD,
    );
  }

  const onSelectOptions = useCallback(
    (newRunBehaviour: ActionRunBehaviourType) => {
      setRunBehaviour(newRunBehaviour);
      props.onUpdateSettings?.({
        value: newRunBehaviour,
        propertyName: "runBehaviour",
        action: props.action,
      });

      AnalyticsUtil.logEvent("JS_OBJECT_SETTINGS_CHANGED", {
        toggleSetting: "ON_PAGE_LOAD",
        toggleValue: newRunBehaviour,
      });
    },
    [props],
  );

  return (
    <Flex
      alignItems="center"
      className={`t--async-js-function-settings ${props.action.name}-run-behavior-setting`}
      gap="spaces-3"
      id={`${props.action.name}-settings`}
      justifyContent="space-between"
      key={props.action.id}
      w="100%"
    >
      <FunctionName htmlFor={props.action.id} renderAs="label">
        {props.action.name}
      </FunctionName>
      <StyledSelect
        data-testid={`t--dropdown-runBehaviour`}
        dropdownMatchSelectWidth={256}
        id={props.action.id}
        isDisabled={props.disabled}
        listHeight={240}
        onSelect={onSelectOptions}
        size="sm"
        value={selectedValue}
      >
        {options.map((option) => (
          <Option
            aria-label={option.label}
            disabled={option.disabled}
            key={option.value}
            label={option.label}
            value={option.value}
          >
            <Flex flexDirection="column">
              <OptionLabel data-testid={`t--label-${option.label}`}>
                {option.label}
              </OptionLabel>
              <OptionSubText>{option.subText}</OptionSubText>
            </Flex>
          </Option>
        ))}
      </StyledSelect>
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
