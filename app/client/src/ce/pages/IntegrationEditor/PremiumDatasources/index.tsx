import React, { useState } from "react";
import {
  ApiCard,
  CardContentWrapper,
} from "../../../../pages/Editor/IntegrationEditor/NewApi";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Modal, ModalContent, Tag } from "@appsmith/ads";
import styled from "styled-components";
import ContactForm from "./ContactForm";
import { PREMIUM_INTEGRATIONS } from "ee/constants/PremiumDatasourcesConstants";
import {
  getTagText,
  handlePremiumDatasourceClick,
} from "ee/utils/PremiumDatasourcesHelpers";
import { isFreePlan } from "ee/selectors/tenantSelectors";
import { useSelector } from "react-redux";

const ModalContentWrapper = styled(ModalContent)`
  max-width: 518px;
`;

export default function PremiumDatasources() {
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const isFreePlanInstance = useSelector(isFreePlan);
  const handleOnClick = (name: string) => {
    handlePremiumDatasourceClick(name, !isFreePlanInstance);
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
              {getTagText(!isFreePlanInstance)}
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
