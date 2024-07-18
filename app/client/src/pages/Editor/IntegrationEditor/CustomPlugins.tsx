import React, { useEffect, useState } from "react";
import { getCustomPlugins } from "@appsmith/selectors/entitiesSelector";
import type { CustomPlugin } from "api/PluginApi";
import { Modal, ModalBody, ModalContent, ModalHeader } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { ApiCard, CardContentWrapper } from "./NewApi";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import styled from "styled-components";
import { importPartialApplication } from "@appsmith/actions/applicationActions";

const BodyContainer = styled.div`
  flex: 3;
  height: 640px;
  max-height: 82vh;
`;

const ModalContentWrapper = styled(ModalContent)`
  width: 100%;
`;
const ModalBodyWrapper = styled(ModalBody)`
  overflow-y: hidden;
`;

function CustomPluginAPIModal({
  handleClose,
  selectedCustomPlugin,
}: {
  selectedCustomPlugin?: CustomPlugin;
  handleClose: () => void;
}) {
  const dispatch = useDispatch();

  const messageHandler = (event: any) => {
    if (event) {
      const messageReceived = event.data;
      try {
        const importJSON = JSON.parse(messageReceived);
        // Convert JSON object to string
        const jsonString = JSON.stringify(importJSON, null, 2);

        // Create a Blob from the JSON string
        const blob = new Blob([jsonString], { type: "application/json" });

        // Create a File object from the Blob
        const file = new File([blob], "data.json", {
          type: "application/json",
        });

        dispatch(
          importPartialApplication({
            applicationFile: file,
          }),
        );
        handleClose();
      } catch {}
      //Add code to manipulate the received message
    }
  };

  useEffect(() => {
    //add the event listener to read the incoming message
    if (selectedCustomPlugin?.name) {
      window.addEventListener("message", messageHandler);
    }
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [selectedCustomPlugin]);

  return (
    <Modal open={!!selectedCustomPlugin?.name}>
      <ModalContentWrapper
        data-testId="reconnect-datasource-modal"
        onClick={handleClose}
        onEscapeKeyDown={handleClose}
        onInteractOutside={handleClose}
        overlayClassName="reconnect-datasource-modal"
      >
        <ModalHeader>List of Apis for {selectedCustomPlugin?.name}</ModalHeader>
        <ModalBodyWrapper>
          <BodyContainer>
            <iframe
              id="embeddedAppsmith"
              seamless
              src={`https://app.appsmith.com/app/saas-datasource/page1-6698c1aeb230b5638c14cad7?navbar=false&embed=true&datasource_name=${selectedCustomPlugin?.name}`}
              style={{ display: "block", width: "100%", height: "100vh" }}
            />
          </BodyContainer>
        </ModalBodyWrapper>
      </ModalContentWrapper>
    </Modal>
  );
}

export default function CustomPlugins() {
  const [selectedCustomPlugin, setSelectedCustomPlugin] = useState<
    CustomPlugin | undefined
  >();
  const customPlugins = useSelector(getCustomPlugins);
  const handleClick = (plugin: CustomPlugin) => {
    setSelectedCustomPlugin(plugin);
  };

  const handleClose = () => {
    setSelectedCustomPlugin(undefined);
  };

  if (customPlugins.length === 0) return null;

  return (
    <>
      {customPlugins.map((customPlugin) => (
        <ApiCard
          className={`t--createCustomPlugin-${customPlugin.name}`}
          key={customPlugin.name}
          onClick={() => {
            handleClick(customPlugin);
          }}
        >
          <CardContentWrapper>
            <img
              alt={customPlugin.name}
              className={
                "content-icon saasImage t--saas-" + customPlugin.name + "-image"
              }
              src={getAssetUrl(customPlugin.image_base64)}
            />
            <p className="t--plugin-name textBtn">{customPlugin.name}</p>
          </CardContentWrapper>
        </ApiCard>
      ))}
      <CustomPluginAPIModal
        handleClose={handleClose}
        selectedCustomPlugin={selectedCustomPlugin}
      />
    </>
  );
}
