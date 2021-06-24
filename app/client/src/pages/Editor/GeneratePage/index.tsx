import { getTypographyByKey } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";
import PageContent from "./components/PageContent";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
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
`;

const SubHeading = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  margin: 10px;
`;

function GeneratePage() {
  return (
    <Container>
      <HeadingContainer>
        <Heading> 🚀 Quick page generation</Heading>
      </HeadingContainer>
      <SubHeading>
        Select data, table and columns and generate the page.
      </SubHeading>
      <PageContent />
    </Container>
  );
}

export default GeneratePage;
