import { Button, Text } from "design-system";
import React from "react";
import styled from "styled-components";

interface ConflictListProps {
  files: string[];
  handleClick: (file: string) => void;
}

const FilesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 120px;
  overflow: scroll;
  padding: 18px;
  border: 1px solid var(--ads-v2-color-border);
`;

const StyledList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: space-between;
`;

export function ConflictList(props: ConflictListProps) {
  const { files, handleClick } = props;
  return (
    <FilesWrapper>
      {files.map((file, index: number) => {
        return (
          <StyledList key={index}>
            <Text kind="body-m">{file}</Text>
            <span>
              <Button kind="secondary" onClick={() => handleClick(file)}>
                Resolve
              </Button>
            </span>
          </StyledList>
        );
      })}
    </FilesWrapper>
  );
}
