import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  height: 100%;
  overflow-y: auto;
  -ms-overflow-style: none;
`;

export const EntityExplorerWrapper = (props: {
  children: React.ReactNode;
  explorerRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
}) => {
  return (
    <Wrapper
      className={`t--entity-explorer-wrapper relative overflow-y-auto ${
        props.isActive ? "" : "hidden"
      }`}
      ref={props.explorerRef}
    >
      {props.children}
    </Wrapper>
  );
};
