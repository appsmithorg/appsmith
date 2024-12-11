import {
  Button,
  Flex,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTrigger,
} from "@appsmith/ads";
import { createMessage, REQUEST_NEW_INTEGRATIONS } from "ee/constants/messages";
import React, { useState, type ReactNode } from "react";
import styled from "styled-components";
import Form from "./form";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const RequestNewIntegrationWrapper = styled(Flex)`
  padding: var(--ads-spaces-7);
  border-top: 1px solid var(--ads-v2-colors-content-surface-default-border);
  position: sticky;
  bottom: 0;
  background: var(--ads-v2-color-bg);
`;

const ModalContentWrapper = styled(ModalContent)`
  max-width: 518px;
`;

function RequestModal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Modal onOpenChange={setOpen} open={open}>
      <ModalTrigger>{children}</ModalTrigger>
      <ModalContentWrapper>
        <ModalHeader>
          {createMessage(REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_HEADING)}
        </ModalHeader>
        <Form closeModal={() => setOpen(false)} />
      </ModalContentWrapper>
    </Modal>
  );
}

export default function RequestNewIntegration() {
  return (
    <RequestNewIntegrationWrapper gap="spaces-5" justifyContent="flex-end">
      <p>{createMessage(REQUEST_NEW_INTEGRATIONS.UNABLE_TO_FIND)}</p>
      <RequestModal>
        <Button
          kind="secondary"
          onClick={() => {
            AnalyticsUtil.logEvent("REQUEST_INTEGRATION_CTA");
          }}
        >
          {createMessage(REQUEST_NEW_INTEGRATIONS.REQUEST_NEW_BUTTON)}
        </Button>
      </RequestModal>
    </RequestNewIntegrationWrapper>
  );
}
