import React from "react";
import styled from "styled-components";
import explorerIcon from "assets/icons/header/explorer-side-nav.svg";
import dataIcon from "assets/icons/header/database-side-nav.svg";
import libIcon from "assets/icons/header/library-side-nav.svg";
import { SideNavMode } from "pages/Editor/MultiPaneContainer";

export const SIDE_NAV_WIDTH = 55;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: ${SIDE_NAV_WIDTH}px;

  background: #ffffff;
  box-shadow: 1px 0 0 #f1f1f1;
  height: 100%;
  border-right: 1px solid #e8e8e8;
  z-index: 3;
`;

const Button = styled.div`
  // for icon alignment inside button
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  cursor: pointer;
  width: ${SIDE_NAV_WIDTH}px;
  height: 50px;

  background: #ffffff;
  box-shadow: inset -1px -1px 0px #e8e8e8;
`;

function SideNav(props: {
  onSelect: (sideNavMode: SideNavMode | undefined) => void;
}) {
  return (
    <Container onClick={() => props.onSelect(undefined)}>
      <Button
        onClick={(ev) => {
          props.onSelect(SideNavMode.Explorer);
          ev.stopPropagation();
        }}
      >
        <img alt="Explorer" src={explorerIcon} />
      </Button>
      <Button
        onClick={(ev) => {
          props.onSelect(SideNavMode.DataSources);
          ev.stopPropagation();
        }}
      >
        <img alt="Datasources" src={dataIcon} />
      </Button>
      <Button
        onClick={(ev) => {
          props.onSelect(SideNavMode.Libraries);
          ev.stopPropagation();
        }}
      >
        <img alt="library" src={libIcon} />
      </Button>

      {/* Bottom buttons */}
      {/* <Button
        className="mt-auto"
        onClick={(ev) => {
          props.onSelect(SideNavMode.Libraries);
          ev.stopPropagation();
        }}
      >
        <img alt="library" src={libIcon} />
      </Button>

      <Button
        onClick={(ev) => {
          props.onSelect(SideNavMode.Libraries);
          ev.stopPropagation();
        }}
      >
        <img alt="library" src={libIcon} />
      </Button> */}
    </Container>
  );
}

export default SideNav;
