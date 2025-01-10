import React, { useState } from "react";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Modal, ModalContent, Tag } from "@appsmith/ads";
import styled from "styled-components";
import ContactForm from "./ContactForm";
import { getTagText, handlePremiumDatasourceClick } from "./Helpers";
import { isFreePlan } from "ee/selectors/tenantSelectors";
import { useSelector } from "react-redux";
import DatasourceItem from "../DatasourceItem";
import type { PremiumIntegration } from "./Constants";

const ModalContentWrapper = styled(ModalContent)`
  max-width: 518px;
`;

const PremiumTag = styled(Tag)<{ isBusinessOrEnterprise: boolean }>`
  color: ${(props) =>
    props.isBusinessOrEnterprise
      ? "var(--ads-v2-color-gray-700)"
      : "var(--ads-v2-color-purple-700)"};
  background-color: ${(props) =>
    props.isBusinessOrEnterprise
      ? "var(--ads-v2-color-gray-100)"
      : "var(--ads-v2-color-purple-100)"};
  border-color: ${(props) =>
    props.isBusinessOrEnterprise ? "#36425233" : "#401d7333"};
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-2);
  text-transform: uppercase;
  > span {
    font-weight: 700;
    font-size: 10px;
  }
`;

export default function PremiumDatasources(props: {
  plugins: PremiumIntegration[];
}) {
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
            <PremiumTag
              isBusinessOrEnterprise={!isFreePlanInstance}
              isClosable={false}
              kind={"premium"}
            >
              {getTagText(!isFreePlanInstance)}
            </PremiumTag>
          }
        />
      ))}
      <Modal onOpenChange={onOpenChange} open={!!selectedIntegration}>
        <ModalContentWrapper>
          <ContactForm
            closeModal={() => setSelectedIntegration("")}
            integrationName={selectedIntegration}
            onSubmit={() => {}}
          />
        </ModalContentWrapper>
      </Modal>
    </>
  );
}
