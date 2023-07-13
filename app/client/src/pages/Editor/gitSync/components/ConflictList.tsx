import { Icon, Text } from "design-system";
import React from "react";
import styled from "styled-components";

interface ConflictListProps {
  files: {
    filepath: string;
    resolved: boolean;
  }[];
  handleClick: (file: { filepath: string; resolved: boolean }) => void;
}

const FilesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 120px;
  overflow: auto;
  padding: 4px;
  border: 1px solid var(--ads-v2-color-border);
`;

const StyledList = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 4px;

  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

export function ConflictList(props: ConflictListProps) {
  const { files, handleClick } = props;

  return (
    <FilesWrapper>
      {files.map((file, index: number) => {
        return (
          <StyledList key={index} onClick={() => handleClick(file)}>
            <div className="flex gap-1">
              <Icon
                color={file.resolved ? "green" : "red"}
                name={file.resolved ? "oval-check" : "warning-line"}
                size={"md"}
              />
              <Text kind="body-m">
                {file.filepath.replace(/^.*[\\\/]/, "")}
              </Text>
            </div>
            <div>
              <Icon name={"arrow-right-s-line"} size={"md"} />
            </div>
          </StyledList>
        );
      })}
    </FilesWrapper>
  );
}
