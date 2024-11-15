import {
  ADD_PAGE_FROM_TEMPLATE_MODAL,
  createMessage,
} from "ee/constants/messages";
import React from "react";
import styled from "styled-components";

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
`;

interface TemplateModalHeaderProps {
  className?: string;
}

function TemplateModalHeader(props: TemplateModalHeaderProps) {
  return (
    <HeaderWrapper className={props.className}>
      {createMessage(ADD_PAGE_FROM_TEMPLATE_MODAL.title)}
    </HeaderWrapper>
  );
}

export default TemplateModalHeader;
