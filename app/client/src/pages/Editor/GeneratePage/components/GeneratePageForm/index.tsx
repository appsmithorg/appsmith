import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";

import { GENERATE_PAGE_FORM_TITLE } from "constants/messages";

import BaseForm from "./BaseForm";

//  ---------- Styles ----------

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
  ${(props) => getTypographyByKey(props, "p1")};
  font-weight: 500;
  color: ${Colors.CODE_GRAY};
  font-size: 24px;
`;

// ---------- GeneratePageForm Component ----------

function GeneratePageForm() {
  return (
    <div>
      <Wrapper>
        <DescWrapper>
          <Title>{GENERATE_PAGE_FORM_TITLE()}</Title>
        </DescWrapper>
      </Wrapper>
      <BaseForm />
    </div>
  );
}

export default GeneratePageForm;
