import type { Workspace } from "ee/constants/workspaceConstants";
import { Icon, Text } from "@appsmith/ads";
import React from "react";
import { useHistory } from "react-router";
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
  const history = useHistory();

  if (!workspacesList || workspacesList?.length === 0) return null;

  return (
    <div className="mb-2">
      <Text className="!mb-2 !block" kind="body-s">
        Workspaces
      </Text>
      {workspacesList.map((workspace: Workspace) => (
        <SearchListItem
          data-testid={workspace.name}
          key={workspace.id}
          onClick={() => {
            setIsDropdownOpen(false);
            history.push(`/applications?workspaceId=${workspace?.id}`);
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
