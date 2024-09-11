import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link, Tag, Text, Tooltip } from "@appsmith/ads";
import { BUSINESS_TAG, createMessage } from "ee/constants/messages";
import { capitalizeFirstLetter } from "utils/helpers";
import { getRampLink, showProductRamps } from "ee/selectors/rampSelectors";
import {
  RAMP_NAME,
  RampFeature,
  RampSection,
} from "utils/ProductRamps/RampsControlList";
import { useSelector } from "react-redux";
import type { EnvironmentType } from "constants/EnvironmentContants";
import { environmentList } from "constants/EnvironmentContants";
import { DisabledTooltipContent } from "ee/components/SwitchEnvironment";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ads-v2-color-border);
  width: 160px;
  height: 100%;
`;

export const FilterComponentContainer = styled.div<{
  isSelected: boolean;
  disabled: boolean;
}>`
  display: flex;
  flex-direction: row;
  padding: 12px 8px;
  align-items: center;
  justify-content: flex-start;
  border-radius: var(--ads-v2-border-radius);
  width: 159px;

  ${(props) =>
    props.isSelected && `background: var(--ads-color-background-secondary);`}

  ${(props) => (props.disabled ? ` cursor: not-allowed;` : `cursor: pointer;`)}
`;

export const FilterComponentLabel = styled(Text)<{ disabled: boolean }>`
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  text-overflow: ellipsis;
  overflow: hidden;
`;

export const TooltipLink = styled(Link)`
  display: inline;
`;

export interface DSDataFilterProps {
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

export function DSDataFilter({
  isInsideReconnectModal,
  viewMode,
}: DSDataFilterProps) {
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
      environmentList.length > 0 &&
      canShowRamp &&
      !viewMode &&
      !isInsideReconnectModal;

    if (showFilterPane !== isRenderAllowed) setShowFilterPane(isRenderAllowed);
    // If there are no environments, do nothing
    if (!environmentList.length) return;
  }, [environmentList.length, viewMode, isInsideReconnectModal]);

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

  return (
    <Container>
      {environmentList.map((env: EnvironmentType) => {
        const isDisabled = !env.selected;
        return isDisabled ? (
          <Tooltip content={DisabledTooltipContent(rampLink)} placement="right">
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
