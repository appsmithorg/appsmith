import React from "react";
import styled from "styled-components";
import AppViewer from "pages/AppViewer/";
import Pane from "./Pane";

const Container = styled.div`
  margin-top: 50px;
  height: calc(100vh - 50px);
  width: 100vw;
  display: flex;
`;

const Left = styled.div`
  flex-basis: 75%;
`;

const Right = styled.div`
  flex-basis: 25%;
`;

export default function ThemeComponent(props: any) {
  return (
    <Container>
      <Left>
        <AppViewer {...props} />
      </Left>
      <Right>
        <Pane />
      </Right>
    </Container>
  );
}
