import React from "react";
import styled from "styled-components";

const StyledContainer = styled.div`
  display: flex;
  height: 100vmax;
  width: 100vmax;
  background-color: black;
`;

export function DiffViewer({ file }: { file: string }) {
  return <StyledContainer>{file}</StyledContainer>;
}
