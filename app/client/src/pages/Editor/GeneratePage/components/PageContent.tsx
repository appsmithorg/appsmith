import React from "react";
import styled from "constants/DefaultTheme";
import GeneratePageForm from "./GeneratePageForm/GeneratePageForm";

const Container = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
  margin-top: 40px;
`;

function PageContent() {
  return (
    <Container>
      <GeneratePageForm />
    </Container>
  );
}

export default PageContent;
