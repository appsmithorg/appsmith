import React, { useState } from "react";
import { ApiCard, CardContentWrapper } from "../NewApi";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Modal, ModalContent, Tag } from "@appsmith/ads";
import styled from "styled-components";
import ContactForm from "./ContactForm";
import { createMessage, PREMIUM_DATASOURCES } from "ee/constants/messages";

const PREMIUM_INTEGRATIONS = [
  {
    name: "Zendesk",
    icon: "",
  },
  {
    name: "Salesforce",
    icon: "",
  },
];

const ModalContentWrapper = styled(ModalContent)`
  max-width: 518px;
`;

export function PremiumDatasources() {
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const handleOnClick = (name: string) => {
    AnalyticsUtil.logEvent("PREMIUM_INTEGRATION_CTA", {
      integrationName: name,
    });
    setSelectedIntegration(name);
  };

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedIntegration("");
    }
  };

  const isEnterprise = false;

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
              {isEnterprise
                ? createMessage(PREMIUM_DATASOURCES.SOON_TAG)
                : createMessage(PREMIUM_DATASOURCES.PREMIUM_TAG)}
            </Tag>
          </CardContentWrapper>
        </ApiCard>
      ))}
      <Modal onOpenChange={onOpenChange} open={!!selectedIntegration}>
        <ModalContentWrapper>
          <ContactForm
            closeModal={() => setSelectedIntegration("")}
            integrationName={selectedIntegration}
            isEnterprise={isEnterprise}
          />
        </ModalContentWrapper>
      </Modal>
    </>
  );
}
