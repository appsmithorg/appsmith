import {
  FUNCTION_SETTINGS_HEADING,
  NO_JS_FUNCTIONS,
  createMessage,
} from "@appsmith/constants/messages";
import type { JSAction } from "entities/JSCollection";
import React, { useState } from "react";
import styled from "styled-components";
import { RADIO_OPTIONS, SETTINGS_HEADINGS } from "./constants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Icon, Radio, RadioGroup, Tooltip } from "design-system";

interface SettingsHeadingProps {
  text: string;
  hasInfo?: boolean;
  info?: string;
  grow: boolean;
}

export interface OnUpdateSettingsProps {
  value: boolean | number;
  propertyName: string;
  action: JSAction;
}

interface SettingsItemProps {
  action: JSAction;
  disabled?: boolean;
  onUpdateSettings?: (props: OnUpdateSettingsProps) => void;
  renderAdditionalColumns?: (action: JSAction) => React.ReactNode;
}

export interface JSFunctionSettingsProps {
  actions: JSAction[];
  disabled?: boolean;
  onUpdateSettings: SettingsItemProps["onUpdateSettings"];
  renderAdditionalColumns?: SettingsItemProps["renderAdditionalColumns"];
  additionalHeadings?: typeof SETTINGS_HEADINGS;
}

const SettingRow = styled.div<{ isHeading?: boolean; noBorder?: boolean }>`
  display: flex;
  padding: 8px;
  ${(props) =>
    !props.noBorder &&
    `
  border-bottom: solid 1px var(--ads-v2-color-border);
  `}

  ${(props) =>
    props.isHeading &&
    `
  background: var(--ads-v2-color-bg-subtle);
  font-size: ${props.theme.typography.h5.fontSize}px;
  `};
`;

const StyledIcon = styled(Icon)`
  width: max-content;
  height: max-content;
`;

export const SettingColumn = styled.div<{
  grow?: boolean;
  isHeading?: boolean;
}>`
  display: flex;
  align-items: center;
  flex-grow: ${(props) => (props.grow ? 1 : 0)};
  padding: 5px 12px;
  min-width: 250px;

  ${(props) =>
    props.isHeading &&
    `
  font-weight: ${props.theme.fontWeights[2]};
  font-size: ${props.theme.fontSizes[2]}px
  margin-right: 9px;
  `}

  ${StyledIcon} {
    margin-left: 8px;
  }
`;

const JSFunctionSettingsWrapper = styled.div`
  height: 100%;
  overflow: hidden;
`;

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 700px;
  height: 100%;
  & > h3 {
    margin: 20px 0;
    font-size: ${(props) => props.theme.fontSizes[5]}px;
    font-weight: ${(props) => props.theme.fontWeights[2]};
    color: var(--ads-v2-color-fg-emphasis);
  }
  overflow: hidden;
`;

const SettingsRowWrapper = styled.div`
  border-radius: var(--ads-v2-border-radius);
  height: 100%;
  overflow: hidden;
`;
const SettingsHeaderWrapper = styled.div``;
const SettingsBodyWrapper = styled.div`
  overflow: auto;
  max-height: calc(100% - 48px);
`;

function SettingsHeading({ grow, hasInfo, info, text }: SettingsHeadingProps) {
  return (
    <SettingColumn grow={grow} isHeading>
      <span>{text}</span>
      {hasInfo && info && (
        <Tooltip content={createMessage(() => info)}>
          <StyledIcon name="question-line" size="md" />
        </Tooltip>
      )}
    </SettingColumn>
  );
}

function SettingsItem({
  action,
  disabled,
  onUpdateSettings,
  renderAdditionalColumns,
}: SettingsItemProps) {
  const [executeOnPageLoad, setExecuteOnPageLoad] = useState(
    String(!!action.executeOnLoad),
  );
  const [confirmBeforeExecute, setConfirmBeforeExecute] = useState(
    String(!!action.confirmBeforeExecute),
  );

  const onChangeExecuteOnPageLoad = (value: string) => {
    setExecuteOnPageLoad(value);
    onUpdateSettings?.({
      value: value === "true",
      propertyName: "executeOnLoad",
      action,
    });

    AnalyticsUtil.logEvent("JS_OBJECT_SETTINGS_CHANGED", {
      toggleSetting: "ON_PAGE_LOAD",
      toggleValue: value,
    });
  };
  const onChangeConfirmBeforeExecute = (value: string) => {
    setConfirmBeforeExecute(value);
    onUpdateSettings?.({
      value: value === "true",
      propertyName: "confirmBeforeExecute",
      action,
    });

    AnalyticsUtil.logEvent("JS_OBJECT_SETTINGS_CHANGED", {
      toggleSetting: "CONFIRM_BEFORE_RUN",
      toggleValue: value,
    });
  };

  return (
    <SettingRow
      className="t--async-js-function-settings"
      id={`${action.name}-settings`}
    >
      <SettingColumn grow>
        <span>{action.name}</span>
      </SettingColumn>
      <SettingColumn className={`${action.name}-on-page-load-setting`}>
        <RadioGroup
          defaultValue={executeOnPageLoad}
          name={`execute-on-page-load-${action.id}`}
          onChange={onChangeExecuteOnPageLoad}
          orientation="horizontal"
        >
          {RADIO_OPTIONS.map((option) => (
            <Radio
              isDisabled={disabled}
              key={option.label}
              value={option.value}
            >
              {option.label}
            </Radio>
          ))}
        </RadioGroup>
      </SettingColumn>
      <SettingColumn className={`${action.name}-confirm-before-execute`}>
        <RadioGroup
          defaultValue={confirmBeforeExecute}
          name={`confirm-before-execute-${action.id}`}
          onChange={onChangeConfirmBeforeExecute}
          orientation="horizontal"
        >
          {RADIO_OPTIONS.map((option) => (
            <Radio
              isDisabled={disabled}
              key={option.label}
              value={option.value}
            >
              {option.label}
            </Radio>
          ))}
        </RadioGroup>
      </SettingColumn>
      {renderAdditionalColumns?.(action)}
    </SettingRow>
  );
}

function JSFunctionSettingsView({
  actions,
  additionalHeadings = [],
  disabled = false,
  onUpdateSettings,
  renderAdditionalColumns,
}: JSFunctionSettingsProps) {
  return (
    <JSFunctionSettingsWrapper>
      <SettingsContainer>
        <h3>{createMessage(FUNCTION_SETTINGS_HEADING)}</h3>
        <SettingsRowWrapper>
          <SettingsHeaderWrapper>
            <SettingRow isHeading>
              {[...SETTINGS_HEADINGS, ...additionalHeadings].map(
                (setting, index) => (
                  <SettingsHeading
                    grow={index === 0}
                    hasInfo={setting.hasInfo}
                    info={setting.info}
                    key={setting.key}
                    text={setting.text}
                  />
                ),
              )}
            </SettingRow>
          </SettingsHeaderWrapper>
          <SettingsBodyWrapper>
            {actions && actions.length ? (
              actions.map((action) => (
                <SettingsItem
                  action={action}
                  disabled={disabled}
                  key={action.id}
                  onUpdateSettings={onUpdateSettings}
                  renderAdditionalColumns={renderAdditionalColumns}
                />
              ))
            ) : (
              <SettingRow noBorder>
                <SettingColumn>{createMessage(NO_JS_FUNCTIONS)}</SettingColumn>
              </SettingRow>
            )}
          </SettingsBodyWrapper>
        </SettingsRowWrapper>
      </SettingsContainer>
    </JSFunctionSettingsWrapper>
  );
}

export default JSFunctionSettingsView;
