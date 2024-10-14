import React, { useState } from "react";
import {
  Avatar,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Text,
} from "@appsmith/wds";

import styles from "./styles.module.css";

// this value might come from props in future. So keeping a temporary value here.
const LOGO =
  "https://app.appsmith.com/static/media/appsmith_logo_square.3867b1959653dabff8dc.png";

export const ChatHeader: React.FC<{
  chatTitle?: string;
  username: string;
  chatDescription?: string;
}> = ({ chatDescription, chatTitle, username }) => {
  const [isChatDescriptionModalOpen, setIsChatDescriptionModalOpen] =
    useState(false);

  return (
    <>
      <div className={styles.header}>
        <Flex alignItems="center" gap="spacing-2">
          <Flex alignItems="center" gap="spacing-3">
            <Avatar label="Appsmith AI" size="large" src={LOGO} />
            <Text fontWeight={600} size="subtitle">
              {chatTitle}
            </Text>
          </Flex>
          <Button
            icon="info-square-rounded"
            onPress={() => setIsChatDescriptionModalOpen(true)}
            variant="ghost"
          />
        </Flex>
        <Flex alignItems="center" gap="spacing-2">
          <Avatar label={username} />
          <Text data-testid="t--aichat-username" size="body">
            {username}
          </Text>
        </Flex>
      </div>

      <Modal
        isOpen={isChatDescriptionModalOpen}
        setOpen={setIsChatDescriptionModalOpen}
      >
        <ModalContent>
          <ModalHeader title="Information about the bot" />
          <ModalBody>{chatDescription}</ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
