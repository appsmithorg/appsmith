import React from "react";
import { Select, Option, Icon } from "@appsmith/ads";
import styled from "styled-components";
import { Tooltip } from "@appsmith/ads";
import { SORT_BY, createMessage } from "ce/constants/messages";

export type WorkspaceSortOption = "recent" | "alphabetical";

interface WorkspaceSortSelectorProps {
  value: WorkspaceSortOption;
  onChange: (value: WorkspaceSortOption) => void;
}

const SortSelectorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 12px;
`;

const SortIcon = styled(Icon)`
  color: var(--ads-v2-color-fg-muted);
  flex-shrink: 0;
`;

const SelectWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const WorkspaceSortSelector: React.FC<WorkspaceSortSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <SortSelectorWrapper>
      <Tooltip content={createMessage(SORT_BY)} placement="bottom" >
        <SortIcon name="sort-asc" size="sm" />
      </Tooltip>
      <SelectWrapper>
        <Select
          data-testid="t--workspace-sort-selector"
          onSelect={(val) => onChange(val as WorkspaceSortOption)}
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

export default WorkspaceSortSelector;