import React, { useState } from "react";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Modal, ModalContent } from "@appsmith/ads";
import styled from "styled-components";
import ContactForm from "./ContactForm";
import { handlePremiumDatasourceClick } from "./Helpers";
import DatasourceItem from "../DatasourceItem";
import type { UpcomingIntegration } from "entities/Plugin";
import PremiumFeatureTag from "components/editorComponents/PremiumFeatureTag";

const ModalContentWrapper = styled(ModalContent)`
  max-width: 518px;
`;

export default function PremiumDatasources(props: {
  plugins: UpcomingIntegration[];
  isIntegrationsEnabledForPaid?: boolean;
}) {
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const handleOnClick = (name: string) => {
    handlePremiumDatasourceClick(name, props.isIntegrationsEnabledForPaid);
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
          icon={getAssetUrl(integration.iconLocation)}
          key={integration.name}
          name={integration.name}
          rightSibling={
            !props.isIntegrationsEnabledForPaid && <PremiumFeatureTag />
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
