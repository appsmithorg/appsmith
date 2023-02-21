import React from "react";
import styled from "styled-components";
import explorerIcon from "assets/icons/header/explorer-side-nav.svg";
import dataIcon from "assets/icons/header/database-side-nav.svg";
import libIcon from "assets/icons/header/library-side-nav.svg";

export const SIDE_NAV_WIDTH = 55;

const Container = styled.div`
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  width: ${SIDE_NAV_WIDTH}px;
  display: block;

  background: #ffffff;
  box-shadow: 1px 0 0 #f1f1f1;
  height: 100%;
  border-right: 1px solid #e8e8e8;
  z-index: 3;
`;

const Button = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3px;

  width: ${SIDE_NAV_WIDTH}px;
  height: 50px;

  /* Grays/White

  White color mostly used on backgrounds. We’re minimal and clean product and we use a lot of white.
  */
  background: #ffffff;
  box-shadow: inset -1px -1px 0px #e8e8e8;

  /* Inside auto layout */

  img {
    height: 20px;
    width: 18px;
  }

  span {
    /* Explorer */
    font-style: normal;
    font-weight: 600;
    font-size: 8px;
    line-height: 140%;
    /* or 11px */

    color: #000000;
  }
`;

function SideNav() {
  return (
    <Container>
      <Button>
        <img alt="Explorer" src={explorerIcon} />
      </Button>
      <Button>
        <img alt="Datasources" src={dataIcon} />
      </Button>
      <Button>
        <img alt="library" src={libIcon} />
      </Button>
    </Container>
  );
}

export default SideNav;
