import React from "react";
import ActionCards from "./ActionCards";
import styled from "constants/DefaultTheme";
import GeneratePageForm from "./GeneratePageForm";

const Container = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
`;

function PageContent() {
  const pathname = window.location.pathname;
  let hasFormRoute = false;
  if (pathname.includes("/form")) {
    hasFormRoute = true;
  }
  return (
    <Container>
      {!hasFormRoute ? <ActionCards /> : <GeneratePageForm />}
    </Container>
  );
}

export default PageContent;
