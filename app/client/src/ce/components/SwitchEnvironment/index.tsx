import React from "react";
import { useSelector } from "react-redux";
import { datasourceEnvEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import styled from "styled-components";
import { Link, Option, Select, Text, Tooltip } from "design-system";
import { capitalizeFirstLetter } from "utils/helpers";

const Wrapper = styled.div`
  display: flex;
  border-right: 1px solid var(--ads-v2-color-border);
  padding: 0px 16px;

  .rc-select-selector {
    min-width: 160px;
    width: 160px;
    border: none;
  }
`;

const StyledText = styled(Text)<{
  disabled: boolean;
}>`
  color: var(--ads-v2-color-fg-emphasis);
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

type Props = {
  viewMode?: boolean;
};

type EnvironmentType = {
  id: string;
  name: string;
  selected: boolean;
};

const environmentList: Array<EnvironmentType> = [
  {
    id: "1",
    name: "production",
    selected: true,
  },
  {
    id: "2",
    name: "staging",
    selected: false,
  },
];

export default function SwitchEnvironment({}: Props) {
  // Fetching feature flags from the store and checking if the feature is enabled
  const allowedToRender = useSelector(datasourceEnvEnabled);

  if (allowedToRender) return null;

  const renderEnvOption = (env: EnvironmentType) => {
    return (
      <StyledText disabled={!env.selected}>
        {capitalizeFirstLetter(env.name)}
      </StyledText>
    );
  };

  const DisabledTooltipContent = () => {
    return (
      <>
        <Text>To access environments for datasources, try out our</Text>
        <Link>business edition</Link>
      </>
    );
  };

  return (
    <Wrapper aria-disabled={false} data-testid="t--switch-env">
      <Select
        className="select_environemnt"
        dropdownClassName="select_environemnt_dropdown"
        value={capitalizeFirstLetter(environmentList[0].name)}
      >
        {environmentList.map((env: EnvironmentType) => (
          <Option
            aria-checked={env.selected}
            data-testid={`t--switch-env-dropdown-option-${env.name}`}
            isDisabled={!env.selected}
            key={env.id}
            label={env.name}
            selected={env.selected}
            value={env}
          >
            {env.selected ? (
              <div className="flex flex-col gap-1">{renderEnvOption(env)}</div>
            ) : (
              <Tooltip content={DisabledTooltipContent()} placement="right">
                {renderEnvOption(env)}
              </Tooltip>
            )}
          </Option>
        ))}
      </Select>
    </Wrapper>
  );
}
