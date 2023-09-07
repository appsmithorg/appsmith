import React from "react";
import GitUserSettings from "./GitUserSettings";
import GitDisconnect from "./GitDisconnect";
import styled from "styled-components";

const Container = styled.div`
  min-height: calc(360px + 52px + 16px);
`;

function GitSettings() {
  return (
    <Container>
      <GitUserSettings />
      <GitDisconnect />
    </Container>
  );
}

export default GitSettings;
