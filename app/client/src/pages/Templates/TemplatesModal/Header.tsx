// import { Text, TextType } from "design-system-old";
import React from "react";
import styled from "styled-components";

const BackText = styled.div<{ width?: number; hidden?: boolean }>`
  ${(props) => props.hidden && "visibility: hidden;"}
`;
const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  .back-button {
    margin-right: 8px;
  }
`;

interface TemplateModalHeaderProps {
  onBackPress?: () => void;
  hideBackButton?: boolean;
  className?: string;
}

function TemplateModalHeader(props: TemplateModalHeaderProps) {
  return (
    <HeaderWrapper className={props.className}>
      <BackText>Add page(s) from template</BackText>
    </HeaderWrapper>
  );
}

export default TemplateModalHeader;
