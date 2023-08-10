import React, { useEffect, useState } from "react";
import { datasourceEnvEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Link, Tag, Text, Tooltip } from "design-system";
import {
  BUSINESS_EDITION_TEXT,
  BUSINESS_TAG,
  SWITCH_ENV_DISABLED_TOOLTIP_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { capitalizeFirstLetter } from "utils/helpers";
import { getRampLink, showProductRamps } from "utils/ProductRamps";
import { RAMP_NAME, RampFeature } from "utils/ProductRamps/RampsControlList";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ads-v2-color-border);
  width: 160px;
  height: 100%;
`;

const FilterComponentContainer = styled.div<{
  isSelected: boolean;
  disabled: boolean;
}>`
  display: flex;
  flex-direction: row;
  padding: 12px 8px;
  align-items: center;
  justify-content: flex-start;
  border-radius: var(--ads-v2-border-radius);

  ${(props) =>
    props.isSelected && `background: var(--ads-color-background-secondary);`}

  ${(props) => (props.disabled ? ` cursor: not-allowed;` : `cursor: pointer;`)}
`;

const FilterComponentLabel = styled(Text)<{ disabled: boolean }>`
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const TooltipLink = styled(Link)`
  display: inline;
`;

type DSDataFilterProps = {
  datasourceId: string;
  updateFilter: (
    id: string,
    name: string,
    userPermissions: string[],
    showFilterPane: boolean,
  ) => boolean;
  pluginType: string;
  pluginName: string;
  isInsideReconnectModal: boolean;
  viewMode: boolean;
  filterId: string; // id of the selected environment, used to keep the parent and child in sync
};

type EnvironmentType = {
  id: string;
  name: string;
  selected: boolean;
  userPermissions: string[];
};

const environments: Array<EnvironmentType> = [
  {
    id: "unused_env",
    name: "production",
    selected: true,
    userPermissions: [],
  },
  {
    id: "unused_env",
    name: "staging",
    selected: false,
    userPermissions: [],
  },
];

function DSDataFilter({
  isInsideReconnectModal,
  updateFilter,
  viewMode,
}: DSDataFilterProps) {
  const [showFilterPane, setShowFilterPane] = useState(false);
  const datasourceEnv: boolean = useSelector(datasourceEnvEnabled);
  const showRamps = showProductRamps(RAMP_NAME.MULTIPLE_ENV);

  // update the selected environment if the list of environments changes
  useEffect(() => {
    const isRenderAllowed =
      environments.length > 0 &&
      datasourceEnv &&
      showRamps &&
      !viewMode &&
      !isInsideReconnectModal;

    if (showFilterPane !== isRenderAllowed) setShowFilterPane(isRenderAllowed);
    // If there are no environments, do nothing
    if (!environments.length) return;
    const defaultSelectedEnvironment = environments[0];

    const updateSuccess = updateFilter(
      defaultSelectedEnvironment.id,
      defaultSelectedEnvironment.name,
      defaultSelectedEnvironment?.userPermissions || [],
      isRenderAllowed,
    );

    if (!updateSuccess) return;
  }, [environments.length, viewMode, isInsideReconnectModal]);

  if (!showFilterPane) return null;

  const renderOption = (env: EnvironmentType, isDisabled: boolean) => {
    const disabledState = isDisabled;
    return (
      <FilterComponentContainer
        disabled={disabledState}
        isSelected={env.selected}
        key={`${env.id}-parent`}
      >
        <FilterComponentLabel
          aria-disabled={disabledState}
          aria-selected={env.selected}
          data-testid={`t--ds-data-filter-${env.name}`}
          disabled={disabledState}
          key={env.id}
          kind={"body-m"}
        >
          {capitalizeFirstLetter(env.name)}
        </FilterComponentLabel>
        {isDisabled && (
          <Tag isClosable={false} size="md" style={{ marginLeft: "auto" }}>
            {createMessage(BUSINESS_TAG)}
          </Tag>
        )}
      </FilterComponentContainer>
    );
  };

  const DisabledTooltipContent = () => {
    return (
      <Text color="var(--ads-v2-color-white)" kind="action-m">
        {createMessage(SWITCH_ENV_DISABLED_TOOLTIP_TEXT)}
        <TooltipLink
          kind="primary"
          target="_blank"
          to={getRampLink("ds_editor", RampFeature.MultipleEnv)}
        >
          {createMessage(BUSINESS_EDITION_TEXT)}
        </TooltipLink>
      </Text>
    );
  };

  return (
    <Container>
      {environments.map((env: EnvironmentType) => {
        const isDisabled = !env.selected;
        return isDisabled ? (
          <Tooltip content={DisabledTooltipContent()} placement="right">
            {renderOption(env, isDisabled)}
          </Tooltip>
        ) : (
          renderOption(env, isDisabled)
        );
      })}
    </Container>
  );
}
export default DSDataFilter;
