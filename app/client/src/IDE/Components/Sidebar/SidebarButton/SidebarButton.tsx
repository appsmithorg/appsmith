import React, { useCallback } from "react";
import { Flex, Icon, Text, Tooltip } from "@appsmith/ads";
import styled from "styled-components";

import { Condition } from "../../../enums";

const ConditionConfig: Record<Condition, { icon: string; color: string }> = {
  [Condition.Warn]: {
    icon: "warning",
    color: "#ffe283",
  },
  // TODO add this information for further conditions
  // Error: { color: "", icon: "" },
  // Success: { color: "", icon: "" },
};

export interface SidebarButtonProps {
  title?: string;
  selected: boolean;
  icon: string;
  onClick: (urlSuffix: string) => void;
  urlSuffix: string;
  tooltip?: string;
  condition?: Condition;
}

const Container = styled(Flex)`
  justify-content: center;
  flex-direction: column;
  width: 50px;
  text-align: center;
  align-items: center;
  padding: 8px 0;
`;

const IconContainer = styled.div<{ selected: boolean }>`
  padding: 2px;
  background-color: ${(props) =>
    props.selected ? "var(--ads-v2-color-bg-muted)" : "white"};
  border-radius: 3px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;

  &:hover {
    background: var(--ads-v2-color-bg-subtle, #f1f5f9);
  }
`;

const ConditionIcon = styled(Icon)`
  position: absolute;
  bottom: 3px;
  right: -1px;

  &.t--sidebar-${Condition.Warn}-condition-icon {
    color: ${ConditionConfig[Condition.Warn].color};
  }

  // TODO add more condition colors here
`;

function SidebarButton(props: SidebarButtonProps) {
  const { condition, icon, onClick, selected, title, tooltip, urlSuffix } =
    props;
  const handleOnClick = useCallback(() => {
    if (!selected) {
      onClick(urlSuffix);
    }
  }, [selected, onClick, urlSuffix]);

  return (
    <Container>
      <Tooltip
        content={tooltip}
        isDisabled={!!title && !tooltip}
        placement={"right"}
      >
        <IconContainer
          className={`t--sidebar-${title || tooltip}`}
          data-selected={selected}
          onClick={handleOnClick}
          role="button"
          selected={selected}
        >
          <Icon name={icon} size="lg" />
          {condition && (
            <ConditionIcon
              className={`t--sidebar-${condition}-condition-icon`}
              name={ConditionConfig[condition].icon}
              size="md"
            />
          )}
        </IconContainer>
      </Tooltip>
      {title ? <Text kind="body-s">{title}</Text> : null}
    </Container>
  );
}

export default SidebarButton;
