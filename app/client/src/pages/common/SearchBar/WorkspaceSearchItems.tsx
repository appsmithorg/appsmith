import type { Workspace } from "ee/constants/workspaceConstants";
import { Icon, Text } from "@appsmith/ads";
import React, { useState } from "react";
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

const WorkspaceLogoImage = styled.img`
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  object-fit: contain;
  margin-right: 8px;
`;

interface Props {
  workspacesList: Workspace[] | undefined;
  setIsDropdownOpen: (isOpen: boolean) => void;
}

interface WorkspaceItemProps {
  workspace: Workspace;
  setIsDropdownOpen: (isOpen: boolean) => void;
}

const WorkspaceItem = ({
  setIsDropdownOpen,
  workspace,
}: WorkspaceItemProps) => {
  const history = useHistory();
  const [imageError, setImageError] = useState(false);
  const hasLogo = workspace.logoUrl && !imageError;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <SearchListItem
      data-testid={workspace.name}
      onClick={() => {
        setIsDropdownOpen(false);
        history.push(`/applications?workspaceId=${workspace?.id}`);
      }}
    >
      {hasLogo ? (
        <WorkspaceLogoImage
          alt={`${workspace.name} logo`}
          onError={handleImageError}
          src={workspace.logoUrl}
        />
      ) : (
        <Icon
          className="!mr-2"
          color="var(--ads-v2-color-fg)"
          name="group-2-line"
          size="md"
        />
      )}
      <Text className="truncate" kind="body-m">
        {workspace.name}
      </Text>
    </SearchListItem>
  );
};

const WorkspaceSearchItems = (props: Props) => {
  const { setIsDropdownOpen, workspacesList } = props;

  if (!workspacesList || workspacesList?.length === 0) return null;

  return (
    <div className="mb-2">
      <Text className="!mb-2 !block" kind="body-s">
        Workspaces
      </Text>
      {workspacesList.map((workspace: Workspace) => (
        <WorkspaceItem
          key={workspace.id}
          setIsDropdownOpen={setIsDropdownOpen}
          workspace={workspace}
        />
      ))}
    </div>
  );
};

export default WorkspaceSearchItems;
