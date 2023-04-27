import React from "react";
import styled from "styled-components";
import PageContent from "./components/PageContent";
import { Text } from "design-system";
import { BackButton } from "components/utils/helperComponents";

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

const SubHeading = styled(Text)`
  margin: 10px 0px;
  text-align: center;
`;

const Header = styled.div`
  width: 100%;

  > a {
    margin: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
  }
`;

const HeaderText = styled.h1`
  font-size: 40px;
  font-style: normal;
  font-weight: 500;
  line-height: 48px;
  letter-spacing: 0px;
  text-align: center;
  margin: 0px;
  color: var(--ads-v2-color-fg-emphasis-plus);
`;

function GeneratePage() {
  const isGenerateFormPage = window.location.pathname.includes("/form");
  const heading = isGenerateFormPage ? "Quick page wizard" : "New page";

  return (
    <Container>
      {isGenerateFormPage ? (
        <Header>
          <BackButton />
        </Header>
      ) : null}

      <HeadingContainer>
        <HeaderText>{heading}</HeaderText>
      </HeadingContainer>
      {isGenerateFormPage ? (
        <SubHeading renderAs="p">
          Auto create a simple CRUD interface on top of your data
        </SubHeading>
      ) : null}

      <PageContent />
    </Container>
  );
}

export default GeneratePage;
