import React from "react";
import ActionCards from "./ActionCards";
import styled from "constants/DefaultTheme";
import GeneratePageForm from "./GeneratePageForm/GeneratePageForm";

const Container = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
  margin-top: 40px;
`;

function PageContent() {
  const pathname = window.location.pathname;
  const hasFormRoute = pathname.includes("/form");
  return (
    <Container>
      {!hasFormRoute ? <ActionCards /> : <GeneratePageForm />}
    </Container>
  );
}

export default PageContent;
