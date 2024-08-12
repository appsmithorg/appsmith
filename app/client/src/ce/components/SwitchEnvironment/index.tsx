import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Icon, Link, Option, Select, Text, Tooltip } from "@appsmith/ads";
import { capitalizeFirstLetter } from "utils/helpers";
import {
  BUSINESS_EDITION_TEXT,
  SWITCH_ENV_DISABLED_TOOLTIP_TEXT,
  createMessage,
} from "ee/constants/messages";
import { getRampLink, showProductRamps } from "ee/selectors/rampSelectors";
import { isDatasourceInViewMode } from "selectors/ui";
import { matchDatasourcePath, matchSAASGsheetsPath } from "constants/routes";
import {
  RAMP_NAME,
  RampFeature,
  RampSection,
} from "utils/ProductRamps/RampsControlList";
import {
  environmentList,
  type EnvironmentType,
} from "constants/EnvironmentContants";

export const Wrapper = styled.div`
  display: flex;
  border-right: 1px solid var(--ads-v2-color-border);
  padding: 0px 16px;

  .rc-select-selector {
    min-width: 160px;
    width: 160px;
    border: none;
  }
`;

export const StyledText = styled(Text)<{
  disabled: boolean;
}>`
  color: var(--ads-v2-color-fg-emphasis);
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  display: flex;
  flex-direction: row;
`;

export const StyledIcon = styled(Icon)`
  margin-right: 8px;
`;

export interface Props {
  viewMode?: boolean;
  editorId: string;
  onChangeEnv?: () => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startSwitchEnvMessage: (...strArgs: any[]) => string;
}

export const TooltipLink = styled(Link)`
  display: inline;
`;

export const DisabledTooltipContent = (rampLink: string) => {
  return (
    <Text
      color="var(--ads-v2-color-white)"
      data-testid="t--switch-env-tooltip"
      kind="action-m"
    >
      {createMessage(SWITCH_ENV_DISABLED_TOOLTIP_TEXT)}
      <TooltipLink kind="primary" target="_blank" to={rampLink}>
        {createMessage(BUSINESS_EDITION_TEXT)}
      </TooltipLink>
    </Text>
  );
};

export default function SwitchEnvironment({}: Props) {
  const [disableSwitchEnvironment, setDisableSwitchEnvironment] =
    useState(false);
  // Fetching feature flags from the store and checking if the feature is enabled
  const showRampSelector = showProductRamps(RAMP_NAME.MULTIPLE_ENV, true);
  const canShowRamp = useSelector(showRampSelector);
  const rampLinkSelector = getRampLink({
    section: RampSection.BottomBarEnvSwitcher,
    feature: RampFeature.MultipleEnv,
  });
  const rampLink = useSelector(rampLinkSelector);

  //listen to url change and disable switch environment if datasource page is open
  useEffect(() => {
    setDisableSwitchEnvironment(
      !!matchDatasourcePath(window.location.pathname) ||
        !!matchSAASGsheetsPath(window.location.pathname),
    );
  }, [window.location.pathname]);
  //URL for datasource edit and review page is same
  //this parameter helps us to differentiate between the two.
  const isDatasourceViewMode = useSelector(isDatasourceInViewMode);

  if (!canShowRamp) return null;

  const renderEnvOption = (env: EnvironmentType) => {
    return (
      <div className="flex w-100">
        <StyledText disabled={!env.selected}>
          {!env.selected && <StyledIcon name="lock-2-line" />}
          {capitalizeFirstLetter(env.name)}
        </StyledText>
      </div>
    );
  };

  return (
    <Wrapper
      aria-disabled={disableSwitchEnvironment && !isDatasourceViewMode}
      data-testid="t--switch-env"
    >
      <Select
        className="select_environemnt"
        dropdownClassName="select_environemnt_dropdown"
        getPopupContainer={(triggerNode) => triggerNode.parentNode.parentNode}
        isDisabled={
          (disableSwitchEnvironment && !isDatasourceViewMode) ||
          environmentList.length === 1
        }
        listHeight={400}
        size="md"
        value={capitalizeFirstLetter(environmentList[0].name)}
      >
        {environmentList.map((env: EnvironmentType, index: number) => (
          <Option
            aria-checked={env.selected}
            data-testid={`t--switch-env-dropdown-option-${env.name}`}
            disabled={!env.selected}
            key={`${env.id}-${index}`}
            label={env.name}
            selected={env.selected}
            value={env}
          >
            {env.selected ? (
              <div className="flex flex-col gap-1">{renderEnvOption(env)}</div>
            ) : (
              <Tooltip
                content={DisabledTooltipContent(rampLink)}
                placement="right"
              >
                {renderEnvOption(env)}
              </Tooltip>
            )}
          </Option>
        ))}
      </Select>
    </Wrapper>
  );
}
