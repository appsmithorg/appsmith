import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { Alignment, Switch } from "@blueprintjs/core";
import { ThemeProp } from "components/ads/common";
import { BlueprintControlTransform } from "constants/DefaultTheme";

export interface SwitchGroupContainerProps {
  inline?: boolean;
  itemCount: number;
}

export const SwitchGroupContainer = styled.div<SwitchGroupContainerProps>`
  display: ${({ inline }) => (inline ? "inline-flex" : "flex")};
  ${({ inline }) => `
    flex-direction: ${inline ? "row" : "column"};
    align-items: ${inline ? "center" : "flex-start"};
    ${inline && "flex-wrap: wrap"};
  `}
  justify-content: ${({ inline, itemCount }) =>
    itemCount > 1 ? `space-between` : inline ? `flex-start` : `center`};
  width: 100%;
  height: 100%;
  overflow: auto;
  border: 1px solid transparent;
  padding: 2px 4px;

  ${BlueprintControlTransform}
`;

export interface StyledSwitchProps {
  disabled?: boolean;
  inline?: boolean;
  itemCount: number;
  rowSpace: number;
}

const StyledSwitch = styled(Switch)<ThemeProp & StyledSwitchProps>`
  height: ${({ rowSpace }) => rowSpace}px;

  &.bp3-control.bp3-switch {
    margin-top: ${({ inline, itemCount }) =>
      (inline || itemCount === 1) && `4px`};
  }
`;

function SwitchGroupComponent(props: SwitchGroupComponentProps) {
  const { disabled, inline, items, onChange, rowSpace, selectedValues } = props;

  const sortedItems = useMemo(() => {
    const itemsArray: Item[] = Object.values(items || []);
    return itemsArray.sort((a: Item, b: Item) => {
      return a.index - b.index;
    });
  }, [items]);

  const itemCount = sortedItems.length;

  const handleChange = useCallback((id: string) => {
    return (event: React.FormEvent<HTMLElement>) => {
      const isChecked = (event.target as HTMLInputElement).checked;
      onChange(id, isChecked);
    };
  }, []);

  return (
    <SwitchGroupContainer inline={inline} itemCount={itemCount}>
      {sortedItems.map((item: Item) => {
        return (
          item.isVisible && (
            <StyledSwitch
              alignIndicator={item.alignIndicator}
              checked={(selectedValues || []).includes(item.value)}
              defaultChecked={item.defaultChecked}
              disabled={disabled || item.isDisabled}
              inline={inline}
              itemCount={itemCount}
              key={item.id}
              label={item.label}
              onChange={handleChange(item.id)}
              rowSpace={rowSpace}
            />
          )
        );
      })}
    </SwitchGroupContainer>
  );
}

export interface Item {
  widgetId: string;
  id: string;
  index: number;
  isVisible?: boolean;
  isDisabled?: boolean;
  label?: string;
  value: string;
  alignIndicator?: Alignment;
  defaultChecked?: boolean;
  checked?: boolean;
}

export interface SwitchGroupComponentProps {
  disabled?: boolean;
  inline?: boolean;
  items?: Record<string, Item>;
  rowSpace: number;
  onChange: (id: string, value: boolean) => void;
  selectedValues: string[];
}

export default SwitchGroupComponent;
