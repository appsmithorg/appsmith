import React from "react";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import GeneratePageForm from "components/editorComponents/ChooseTableForm";
import { GENERATE_PAGE_FORM_TITLE } from "@appsmith/constants/messages";
import { getTypographyByKey } from "design-system";

const Container = styled.div`
  padding: 20px;
  margin-top: 40px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 20px 0px;
  border: none;
`;

const DescWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.p`
  ${getTypographyByKey("p1")};
  font-weight: 500;
  color: ${Colors.CODE_GRAY};
  font-size: 24px;
`;

function PageContent() {
  return (
    <Container>
      <Wrapper>
        <DescWrapper>
          <Title>{GENERATE_PAGE_FORM_TITLE()}</Title>
        </DescWrapper>
      </Wrapper>
      <GeneratePageForm />
    </Container>
  );
}

export default PageContent;
