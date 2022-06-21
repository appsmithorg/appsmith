import React from "react";
import styled from "styled-components";

export const SkeletonWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

function Skeleton() {
  return <SkeletonWrapper className="bp3-skeleton" />;
}

export default Skeleton;
