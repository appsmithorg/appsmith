import React from "react";
import styled from "styled-components";

const HeaderWrapper = styled.header`
  height: ${props => props.theme.headerHeight};
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  background: white;
`;
type AppViewerHeaderProps = {};

export const AppViewerHeader = (props: AppViewerHeaderProps) => {
  return <HeaderWrapper {...props} />;
};

export default AppViewerHeader;
