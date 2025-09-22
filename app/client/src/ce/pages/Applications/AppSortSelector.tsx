import React from "react";
import { Select, Option, Icon } from "@appsmith/ads";
import styled from "styled-components";
import { Tooltip } from "@appsmith/ads";
import { SORT_BY, createMessage } from "ce/constants/messages";

export type SortOption = "recent" | "alphabetical";

interface AppSortSelectorProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  isMobile?: boolean;
}

const SortSelectorWrapper = styled.div<{ isMobile?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: ${({ isMobile }) => (isMobile ? 0 : 16)}px;
  min-width: fit-content;
`;

const SortIcon = styled(Icon)`
  color: var(--ads-v2-color-fg-muted);
  flex-shrink: 0;
`;

const SelectWrapper = styled.div`
  min-width: 120px;
`;

const AppSortSelector: React.FC<AppSortSelectorProps> = ({
  value,
  onChange,
  isMobile = false,
}) => {
  return (
    <SortSelectorWrapper isMobile={isMobile}>
      <Tooltip content={createMessage(SORT_BY)} placement="bottom" >
        <SortIcon name="sort-asc" size="sm" />
      </Tooltip>
      <SelectWrapper>
        <Select
          data-testid="t--app-sort-selector"
          onSelect={(val) => onChange(val as SortOption)}
          value={value}
          size="sm"
        >
          <Option value="recent">Recent activity</Option>
          <Option value="alphabetical">Alphabetical</Option>
        </Select>
      </SelectWrapper>
    </SortSelectorWrapper>
  );
};

export default AppSortSelector;