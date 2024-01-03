import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { Icon, Text } from "design-system";
import React from "react";
import styled from "styled-components";

export const SearchListItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  &:hover {
    background-color: var(--ads-v2-color-bg-muted);
    border-radius: 4px;
  }
`;

interface Props {
  workspacesList: Workspace[] | undefined;
  setIsDropdownOpen: (isOpen: boolean) => void;
}

const WorkspaceSearchItems = (props: Props) => {
  const { setIsDropdownOpen, workspacesList } = props;
  if (!workspacesList || workspacesList?.length === 0) return null;
  return (
    <div className="mb-2">
      <Text className="!mb-2 !block" kind="body-s">
        Workspaces
      </Text>
      {workspacesList.map((workspace: Workspace) => (
        <SearchListItem
          data-testId={workspace.name}
          key={workspace.id}
          onClick={() => {
            setIsDropdownOpen(false);
            window.location.href = `${window.location.pathname}#${workspace?.id}`;
          }}
        >
          <Icon
            className="!mr-2"
            color="var(--ads-v2-color-fg)"
            name="group-2-line"
            size="md"
          />
          <Text className="truncate" kind="body-m">
            {workspace.name}
          </Text>
        </SearchListItem>
      ))}
    </div>
  );
};

export default WorkspaceSearchItems;
