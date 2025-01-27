import styled from "styled-components";
import { Icon } from "../../../Icon";
import { Condition } from "../enums";
import { ConditionConfig } from "./constants";
import { Flex } from "../../../Flex";

export const Container = styled(Flex)`
  justify-content: center;
  flex-direction: column;
  width: 50px;
  text-align: center;
  align-items: center;
  padding: 8px 0;
`;
export const IconContainer = styled.div`
  padding: 2px;
  border-radius: 3px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;

  &[data-selected="false"] {
    background-color: var(--ads-v2-color-bg);

    &:hover {
      background-color: var(--ads-v2-color-bg-subtle, #f1f5f9);
    }
  }

  &[data-selected="true"] {
    background-color: var(--ads-v2-color-bg-muted);
  }
`;
export const ConditionIcon = styled(Icon)`
  position: absolute;
  bottom: 3px;
  right: -1px;

  &.t--sidebar-${Condition.Warn}-condition-icon {
    color: ${ConditionConfig[Condition.Warn].color};
  }

  // TODO add more condition colors here
`;
