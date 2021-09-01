import React from "react";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";

const SkeletonRows = styled.div<{ size: number }>`
  height: 20px;
  width: ${(props) => props.size}%;
  margin-top: 12px;
`;

function Loading() {
  return (
    <>
      <SkeletonRows className={Classes.SKELETON} size={90} />
      <SkeletonRows className={Classes.SKELETON} size={60} />
      <SkeletonRows className={Classes.SKELETON} size={30} />
    </>
  );
}

export default Loading;
