import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link, Tag, Text, Tooltip } from "design-system";
import {
  BUSINESS_EDITION_TEXT,
  BUSINESS_TAG,
  SWITCH_ENV_DISABLED_TOOLTIP_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { capitalizeFirstLetter } from "utils/helpers";
import {
  getRampLink,
  showProductRamps,
} from "@appsmith/selectors/rampSelectors";
import {
  RAMP_NAME,
  RampFeature,
  RampSection,
} from "utils/ProductRamps/RampsControlList";
import { useSelector } from "react-redux";

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

interface DSDataFilterProps {
  updateFilter: (
    id: string,
    name: string,
    userPermissions: string[],
  ) => boolean;
  pluginType: string;
  pluginName: string;
  isInsideReconnectModal: boolean;
  viewMode: boolean;
  filterId: string; // id of the selected environment, used to keep the parent and child in sync
}

interface EnvironmentType {
  id: string;
  name: string;
  selected: boolean;
  userPermissions: string[];
}

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

function DSDataFilter({ isInsideReconnectModal, viewMode }: DSDataFilterProps) {
  const [showFilterPane, setShowFilterPane] = useState(false);
  const showRampSelector = showProductRamps(RAMP_NAME.MULTIPLE_ENV, true);
  const canShowRamp = useSelector(showRampSelector);

  const rampLinkSelector = getRampLink({
    section: RampSection.DSEditor,
    feature: RampFeature.MultipleEnv,
  });
  const rampLink = useSelector(rampLinkSelector);

  // update the selected environment if the list of environments changes
  useEffect(() => {
    const isRenderAllowed =
      environments.length > 0 &&
      canShowRamp &&
      !viewMode &&
      !isInsideReconnectModal;

    if (showFilterPane !== isRenderAllowed) setShowFilterPane(isRenderAllowed);
    // If there are no environments, do nothing
    if (!environments.length) return;
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
        <TooltipLink kind="primary" target="_blank" to={rampLink}>
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
