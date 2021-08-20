import React from "react";
import styled from "styled-components";
import PageContent from "./components/PageContent";
import { getTypographyByKey } from "../../../constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { Icon } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";

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
  color: ${Colors.BLACK};
  text-align: center;
`;

const Back = styled.span`
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 16px;
`;

const Header = styled.div`
  width: 100%;
`;

function GeneratePage() {
  const isGenerateFormPage = window.location.pathname.includes("/form");
  const heading = isGenerateFormPage ? "Quick Page Wizard" : "New Page";

  return (
    <Container>
      {isGenerateFormPage ? (
        <Header>
          <Back onClick={() => history.back()}>
            <Icon icon="chevron-left" iconSize={16} />
            <Text
              style={{ color: Colors.DIESEL, lineHeight: "14px" }}
              type={TextType.P1}
            >
              Back
            </Text>
          </Back>
        </Header>
      ) : null}

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
