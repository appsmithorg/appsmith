import React from "react";
import styled from "styled-components";
import PageContent from "./components/PageContent";
import { Text, Link } from "design-system";
const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`;

const HeadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
`;

const SubHeading = styled.p`
  margin: 10px 0px;
  text-align: center;
`;

const Back = styled(Link)`
  margin: 20px 0 20px 8px;
`;

const Header = styled.div`
  width: 100%;
`;

function GeneratePage() {
  const isGenerateFormPage = window.location.pathname.includes("/form");
  const heading = isGenerateFormPage ? "Quick page wizard" : "New page";

  return (
    <Container>
      {isGenerateFormPage ? (
        <Header>
          <Back onClick={() => history.back()} startIcon="arrow-left" to="#">
            Back
          </Back>
        </Header>
      ) : null}

      <HeadingContainer>
        <Text kind="heading-l" renderAs="h1">
          {heading}
        </Text>
      </HeadingContainer>
      {isGenerateFormPage ? (
        <SubHeading>
          Auto create a simple CRUD interface on top of your data
        </SubHeading>
      ) : null}

      <PageContent />
    </Container>
  );
}

export default GeneratePage;
