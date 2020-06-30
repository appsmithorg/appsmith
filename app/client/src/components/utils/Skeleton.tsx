import React from "react";
import { Classes } from "@blueprintjs/core";
import styled from "styled-components";

const StyledDiv = styled.div`
  width: 100%;
  height: 100%;
  display: block;
`;

type SkeletonProps = {
  type?: string;
};

export const Skeleton = () => {
  return <StyledDiv className={Classes.SKELETON} />;
};

export default Skeleton;
