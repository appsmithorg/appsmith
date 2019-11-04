import React from "react";
import styled from "styled-components";
import StyledHeader from "../../../components/designSystems/appsmith/StyledHeader";

const HeaderWrapper = styled(StyledHeader)`
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
