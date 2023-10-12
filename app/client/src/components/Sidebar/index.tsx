import React from "react";
import { getIsAppSidebarEnabled } from "selectors/ideSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import SidebarButton from "./SidebarButton";

const Container = styled.div`
  width: 50px;
  border-right: 1px solid var(--ads-v2-color-border);
  height: 100%;
`;

function Sidebar() {
  const isAppSidebarEnabled = useSelector(getIsAppSidebarEnabled);
  if (!isAppSidebarEnabled) {
    return null;
  }
  return (
    <Container className="z-[3]">
      <SidebarButton icon="database-2-line" selected={false} title="Data" />
      <SidebarButton icon="file-copy-2-line" selected title="Pages" />
    </Container>
  );
}

export default Sidebar;
