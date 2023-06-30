import React from "react";
import styled from "styled-components";

import GeneratePageForm from "./GeneratePageForm/GeneratePageForm";

const Container = styled.div`
  display: flex;
  padding: var(--ads-v2-spaces-7) 0;
`;

function PageContent() {
  return (
    <Container>
      <GeneratePageForm />
    </Container>
  );
}

export default PageContent;
