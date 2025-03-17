import React, { useState } from "react";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Modal, ModalContent, Tag } from "@appsmith/ads";
import styled from "styled-components";
import ContactForm from "./ContactForm";
import { handlePremiumDatasourceClick } from "./Helpers";
import DatasourceItem from "../DatasourceItem";
import type { PremiumIntegration } from "./Constants";
import { createMessage } from "ee/constants/messages";
import { PREMIUM_DATASOURCES } from "ee/constants/messages";

const ModalContentWrapper = styled(ModalContent)`
  max-width: 518px;
`;

const PremiumTag = styled(Tag)`
  color: var(--ads-v2-color-purple-700);
  background-color: var(--ads-v2-color-purple-100);
  border-color: var(--ads-v2-color-purple-300);
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-2);
  text-transform: uppercase;
  > span {
    font-weight: 700;
    font-size: 10px;
  }
`;

export default function PremiumDatasources(props: {
  plugins: PremiumIntegration[];
  isGACEnabled?: boolean;
}) {
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const handleOnClick = (name: string) => {
    handlePremiumDatasourceClick(name, props.isGACEnabled);
    setSelectedIntegration(name);
  };

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedIntegration("");
    }
  };

  return (
    <>
      {props.plugins.map((integration) => (
        <DatasourceItem
          className={`t--create-${integration.name}`}
          handleOnClick={() => {
            handleOnClick(integration.name);
          }}
          icon={getAssetUrl(integration.icon)}
          key={integration.name}
          name={integration.name}
          rightSibling={
            !props.isGACEnabled && (
              <PremiumTag isClosable={false} kind={"premium"}>
                {createMessage(PREMIUM_DATASOURCES.PREMIUM_TAG)}
              </PremiumTag>
            )
          }
        />
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
