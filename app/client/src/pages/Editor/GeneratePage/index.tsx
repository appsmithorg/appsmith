import React from "react";
import styled from "styled-components";
import PageContent from "./components/PageContent";
import { getTypographyByKey } from "../../../constants/DefaultTheme";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  height: 100%;
`;

const HeadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
`;

const Heading = styled.h1`
  font-size: 40px;
  font-style: normal;
  font-weight: 500;
  line-height: 48px;
  letter-spacing: 0px;
  text-align: center;
  margin: 0;
  font-family: ${(props) => props.theme.fonts.text};
`;

const SubHeading = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  margin: 20px 0px;
  color: #000000;
  text-align: center;
`;

function GeneratePage() {
  const isGenerateFormPage = window.location.pathname.includes("/form");
  const heading = isGenerateFormPage ? "Quick Page Wizard" : "New Page";

  return (
    <Container>
      <HeadingContainer>
        <Heading> {heading}</Heading>
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
