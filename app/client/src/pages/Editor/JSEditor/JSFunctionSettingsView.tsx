import { updateFunctionProperty } from "actions/jsPaneActions";
import { createMessage } from "ce/constants/messages";
import { AppIcon, OptionProps, Radio, RadioComponent } from "components/ads";
import TooltipComponent from "components/ads/Tooltip";
import { JSAction } from "entities/JSCollection";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";

const SETTINGS_HEADINGS = [
  {
    text: "Function Name",
    hasInfo: false,
    key: "func_name",
  },
  {
    text: "Run on page load",
    hasInfo: true,
    info: "Setting to allow functions run on page load",
    key: "run_on_pageload",
  },
  {
    text: "Confirm before calling ",
    hasInfo: true,
    info: "Setting to ask for confirmation before executing function",
    key: "run_before_calling",
  },
];
const RADIO_OPTIONS: OptionProps[] = [
  {
    label: "Yes",
    value: "true",
  },
  {
    label: "No",
    value: "false",
  },
];

type SettingsHeadingProps = {
  text: string;
  hasInfo?: boolean;
  info?: string;
  grow: boolean;
};

type SettingsItemProps = {
  action: JSAction;
};

type JSFunctionSettingsProps = {
  actions: JSAction[];
};

const SettingRow = styled.div<{ isHeading?: boolean }>`
  display: flex;
  padding: 8px;
  border-bottom: ${(props) => `solid 1px ${props.theme.colors.table.border}`};
  ${(props) =>
    props.isHeading &&
    `   
  background: #f8f8f8; 
  `};
`;

const StyledIcon = styled(AppIcon)`
  width: max-content;
  height: max-content;
  & > svg {
    width: 13px;
    height: auto;
  }
`;

const SettingColumn = styled.div<{ grow?: boolean }>`
  display: flex;
  align-items: center;
  flex-grow: ${(props) => (props.grow ? 1 : 0)};
  padding: 5px 12px;
  min-width: 190px;

  ${StyledIcon} {
    margin-left: 8px;
  }

  ${Radio} {
    margin-right: 20px;
  }
`;

const JSFunctionSettingsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px ${(props) => props.theme.spaces[13] - 2}px;
  width: max-content;
  min-width: 700px;

  & > h3 {
    margin: 20px 0;
    font-size: 17px;
    text-transform: capitalize;
  }
`;

function SettingsHeading({ grow, hasInfo, info, text }: SettingsHeadingProps) {
  return (
    <SettingColumn grow={grow}>
      <span>{text}</span>
      {hasInfo && info && (
        <TooltipComponent content={createMessage(() => info)}>
          <StyledIcon name="help" />
        </TooltipComponent>
      )}
    </SettingColumn>
  );
}

function SettingsItem({ action }: SettingsItemProps) {
  const dispatch = useDispatch();
  const [executeOnPageLoad, setExecuteOnPageLoad] = useState(
    String(!!action.executeOnLoad),
  );
  const [confirmBeforeExecute, setConfirmBeforeExecute] = useState(
    String(!!action.confirmBeforeExecute),
  );

  const updateProperty = (value: boolean | number, propertyName: string) => {
    dispatch(
      updateFunctionProperty({
        action: action,
        propertyName: propertyName,
        value: value,
      }),
    );
  };
  const onChangeExecuteOnPageLoad = (value: string) => {
    setExecuteOnPageLoad(value);
    updateProperty(value === "true", "executeOnLoad");
  };
  const onChangeConfirmBeforeExecute = (value: string) => {
    setConfirmBeforeExecute(value);
    updateProperty(value === "true", "confirmBeforeExecute");
  };

  return (
    <SettingRow>
      <SettingColumn grow>
        <span>{action.name}</span>
      </SettingColumn>
      <SettingColumn>
        <RadioComponent
          defaultValue={executeOnPageLoad}
          name={`execute-on-page-load-${action.id}`}
          onSelect={onChangeExecuteOnPageLoad}
          options={RADIO_OPTIONS}
        />
      </SettingColumn>
      <SettingColumn>
        <RadioComponent
          defaultValue={confirmBeforeExecute}
          name={`confirm-before-execute-${action.id}`}
          onSelect={onChangeConfirmBeforeExecute}
          options={RADIO_OPTIONS}
        />
      </SettingColumn>
    </SettingRow>
  );
}

function JSFunctionSettingsView({ actions }: JSFunctionSettingsProps) {
  return (
    <JSFunctionSettingsWrapper>
      <h3>Function Settings</h3>
      <SettingRow isHeading>
        {SETTINGS_HEADINGS.map((setting, index) => (
          <SettingsHeading
            grow={index === 0}
            hasInfo={setting.hasInfo}
            info={setting.info}
            key={setting.key}
            text={setting.text}
          />
        ))}
      </SettingRow>
      {actions
        .filter((action) => action.actionConfiguration.isAsync)
        .map((action) => (
          <SettingsItem action={action} key={action.id} />
        ))}
    </JSFunctionSettingsWrapper>
  );
}

export default JSFunctionSettingsView;
