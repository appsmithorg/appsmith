import React, { useState } from "react";
import {
  ApiCard,
  CardContentWrapper,
} from "../../../../pages/Editor/IntegrationEditor/NewApi";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Modal, ModalContent, Tag } from "@appsmith/ads";
import styled from "styled-components";
import ContactForm from "./ContactForm";
import { createMessage, PREMIUM_DATASOURCES } from "ee/constants/messages";
import { PREMIUM_INTEGRATIONS } from "ee/constants/PremiumDatasourcesConstants";
import { handlePremiumDatasourceClick } from "ee/utils/PremiumDatasourcesHelpers";

const ModalContentWrapper = styled(ModalContent)`
  max-width: 518px;
`;

export default function PremiumDatasources() {
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const handleOnClick = (name: string) => {
    handlePremiumDatasourceClick(name);
    setSelectedIntegration(name);
  };

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedIntegration("");
    }
  };

  return (
    <>
      {PREMIUM_INTEGRATIONS.map((integration) => (
        <ApiCard
          className={`t--create-${integration.name}`}
          key={integration.name}
          onClick={() => {
            handleOnClick(integration.name);
          }}
        >
          <CardContentWrapper>
            <img
              alt={integration.name}
              className={"content-icon saasImage"}
              src={getAssetUrl(integration.icon)}
            />
            <p className="t--plugin-name textBtn">{integration.name}</p>
            <Tag isClosable={false} kind={"premium"}>
              {createMessage(PREMIUM_DATASOURCES.TAG_TEXT)}
            </Tag>
          </CardContentWrapper>
        </ApiCard>
      ))}
      <Modal onOpenChange={onOpenChange} open={!!selectedIntegration}>
        <ModalContentWrapper>
          <ContactForm
            closeModal={() => setSelectedIntegration("")}
            integrationName={selectedIntegration}
          />
        </ModalContentWrapper>
      </Modal>
    </>
  );
}
