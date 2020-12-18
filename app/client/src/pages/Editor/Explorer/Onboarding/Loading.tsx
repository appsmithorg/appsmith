import React from "react";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";

const SkeletonRows = styled.div<{ size: number }>`
  height: 20px;
  width: ${props => props.size}%;
  margin-top: 12px;
`;

const Loading = () => {
  return (
    <>
      <SkeletonRows size={90} className={Classes.SKELETON} />
      <SkeletonRows size={60} className={Classes.SKELETON} />
      <SkeletonRows size={30} className={Classes.SKELETON} />
    </>
  );
};

export default Loading;
