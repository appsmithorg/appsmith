import {
  FUNCTION_SETTINGS_HEADING,
  NO_JS_FUNCTIONS,
  createMessage,
} from "ee/constants/messages";
import type { JSAction } from "entities/JSCollection";
import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { CONFIRM_BEFORE_CALLING_HEADING, SETTINGS_HEADINGS } from "./constants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { Icon, Tooltip, Switch } from "@appsmith/ads";
import RemoveConfirmationModal from "./RemoveConfirmBeforeCallingDialog";

interface SettingsHeadingProps {
  text: string;
  hasInfo?: boolean;
  info?: string;
  grow: boolean;
  headingCount: number;
  hidden?: boolean;
}

export interface OnUpdateSettingsProps {
  value: boolean | number;
  propertyName: string;
  action: JSAction;
}

interface SettingsItemProps {
  headingCount: number;
  action: JSAction;
  disabled?: boolean;
  onUpdateSettings?: (props: OnUpdateSettingsProps) => void;
  renderAdditionalColumns?: (
    action: JSAction,
    headingCount: number,
  ) => React.ReactNode;
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
  headingCount: number;
  grow?: boolean;
  isHeading?: boolean;
  hidden?: boolean;
}>`
  visibility: ${(props) => (props.hidden ? "hidden" : "visible")};
  display: flex;
  align-items: center;
  flex-grow: ${(props) => (props.grow ? 1 : 0)};
  padding: 5px 12px;
  width: ${({ headingCount }) => `calc(100% / ${headingCount})`};

  ${(props) =>
    props.isHeading &&
    `
  font-weight: ${props.theme.fontWeights[2]};
  font-size: ${props.theme.fontSizes[2]}px;
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
  width: 100%;
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
const SwitchWrapper = styled.div`
  margin-left: 6ch;
`;

function SettingsHeading({
  grow,
  hasInfo,
  headingCount,
  hidden,
  info,
  text,
}: SettingsHeadingProps) {
  return (
    <SettingColumn
      grow={grow}
      headingCount={headingCount}
      hidden={hidden}
      isHeading
    >
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
  headingCount,
  onUpdateSettings,
  renderAdditionalColumns,
}: SettingsItemProps) {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

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

  const showConfirmBeforeExecute = action.confirmBeforeExecute;

  const onRemoveConfirm = useCallback(() => {
    setShowConfirmationModal(false);
    onChangeConfirmBeforeExecute("false");
  }, []);

  const onCancel = useCallback(() => {
    setShowConfirmationModal(false);
  }, []);

  return (
    <SettingRow
      className="t--async-js-function-settings"
      id={`${action.name}-settings`}
    >
      <SettingColumn grow headingCount={headingCount}>
        <span>{action.name}</span>
      </SettingColumn>
      <SettingColumn
        className={`${action.name}-on-page-load-setting`}
        headingCount={headingCount}
      >
        <SwitchWrapper>
          <Switch
            defaultSelected={JSON.parse(executeOnPageLoad)}
            name={`execute-on-page-load-${action.id}`}
            onChange={(isSelected) =>
              onChangeExecuteOnPageLoad(String(isSelected))
            }
          />
        </SwitchWrapper>
      </SettingColumn>
      <SettingColumn
        className={`${action.name}-confirm-before-execute`}
        headingCount={headingCount}
      >
        <SwitchWrapper>
          {showConfirmBeforeExecute ? (
            <Switch
              className="flex justify-center "
              isSelected={JSON.parse(confirmBeforeExecute)}
              name={`confirm-before-execute-${action.id}`}
              onChange={() => setShowConfirmationModal(true)}
            />
          ) : null}
        </SwitchWrapper>
      </SettingColumn>
      {renderAdditionalColumns?.(action, headingCount)}
      <RemoveConfirmationModal
        isOpen={showConfirmationModal}
        onCancel={onCancel}
        onConfirm={onRemoveConfirm}
      />
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
  const showConfirmBeforeExecuteOption = actions.some(
    (action) => action.confirmBeforeExecute === true,
  );
  const headings = [...SETTINGS_HEADINGS, ...additionalHeadings];

  headings.forEach((heading) => {
    if (heading.key === CONFIRM_BEFORE_CALLING_HEADING.key) {
      CONFIRM_BEFORE_CALLING_HEADING.hidden = !showConfirmBeforeExecuteOption;
    }
  });

  return (
    <JSFunctionSettingsWrapper>
      <SettingsContainer>
        <h3>{createMessage(FUNCTION_SETTINGS_HEADING)}</h3>
        <SettingsRowWrapper>
          <SettingsHeaderWrapper>
            <SettingRow isHeading>
              {headings.map((setting, index) => (
                <SettingsHeading
                  grow={index === 0}
                  hasInfo={setting.hasInfo}
                  headingCount={headings.length}
                  hidden={setting?.hidden}
                  info={setting.info}
                  key={setting.key}
                  text={setting.text}
                />
              ))}
            </SettingRow>
          </SettingsHeaderWrapper>
          <SettingsBodyWrapper>
            {actions && actions.length ? (
              actions.map((action) => (
                <SettingsItem
                  action={action}
                  disabled={disabled}
                  headingCount={headings.length}
                  key={action.id}
                  onUpdateSettings={onUpdateSettings}
                  renderAdditionalColumns={renderAdditionalColumns}
                />
              ))
            ) : (
              <SettingRow noBorder>
                <SettingColumn headingCount={0}>
                  {createMessage(NO_JS_FUNCTIONS)}
                </SettingColumn>
              </SettingRow>
            )}
          </SettingsBodyWrapper>
        </SettingsRowWrapper>
      </SettingsContainer>
    </JSFunctionSettingsWrapper>
  );
}

export default JSFunctionSettingsView;
