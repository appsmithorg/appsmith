import { Flex } from "@appsmith/ads";
import {
  ADD_PAGE_FROM_TEMPLATE_MODAL,
  createMessage,
} from "ee/constants/messages";
import React from "react";

interface TemplateModalHeaderProps {
  className?: string;
}

function TemplateModalHeader(props: TemplateModalHeaderProps) {
  return (
    <Flex alignItems="center" className={props.className}>
      {createMessage(ADD_PAGE_FROM_TEMPLATE_MODAL.title)}
    </Flex>
  );
}

export default TemplateModalHeader;
