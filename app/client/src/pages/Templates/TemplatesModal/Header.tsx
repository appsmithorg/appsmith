// import { Text, TextType } from "design-system-old";
import {
  ADD_PAGE_FROM_TEMPLATE_MODAL,
  createMessage,
} from "@appsmith/constants/messages";
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
      <BackText>{createMessage(ADD_PAGE_FROM_TEMPLATE_MODAL.title)}</BackText>
    </HeaderWrapper>
  );
}

export default TemplateModalHeader;
