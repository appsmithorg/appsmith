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
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

const RequestNewIntegrationWrapper = styled(Flex)`
  padding: var(--ads-spaces-7);
  border-top: 1px solid var(--ads-v2-colors-content-surface-default-border);
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
  const isRequestNewIntegrationEnabled = useFeatureFlag(
    FEATURE_FLAG.ab_request_new_integration_enabled,
  );

  const onRequestButtonClick = () => {
    AnalyticsUtil.logEvent("REQUEST_INTEGRATION_CTA");
  };

  if (!isRequestNewIntegrationEnabled) return null;

  return (
    <RequestNewIntegrationWrapper gap="spaces-5">
      <p>{createMessage(REQUEST_NEW_INTEGRATIONS.UNABLE_TO_FIND)}</p>
      <RequestModal>
        <Button kind="secondary" onClick={onRequestButtonClick}>
          {createMessage(REQUEST_NEW_INTEGRATIONS.REQUEST_BUTTON)}
        </Button>
      </RequestModal>
    </RequestNewIntegrationWrapper>
  );
}
