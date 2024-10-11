import React, { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  Button,
  Switch,
} from "@appsmith/ads";
import { createMessage, IN_APP_EMBED_SETTING } from "ee/constants/messages";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import { useDispatch, useSelector } from "react-redux";
import { updateApplication } from "ee/actions/applicationActions";
import type { ApplicationPayload } from "entities/Application";
import { getIsFetchingApplications } from "ee/selectors/selectedWorkspaceSelectors";

interface ConfirmEnableForkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmEnableForkingModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmEnableForkingModalProps) {
  return (
    <Modal
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={isOpen}
    >
      <ModalContent id="confirm-fork-modal">
        <ModalHeader>
          {createMessage(
            IN_APP_EMBED_SETTING.forkApplicationConfirmation.title,
          )}
        </ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            {createMessage(
              IN_APP_EMBED_SETTING.forkApplicationConfirmation.body,
            )}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={onClose} size="md">
            {createMessage(
              IN_APP_EMBED_SETTING.forkApplicationConfirmation.cancel,
            )}
          </Button>
          <Button
            data-testid={"allow-forking"}
            kind="primary"
            onClick={onConfirm}
            size="md"
          >
            {createMessage(
              IN_APP_EMBED_SETTING.forkApplicationConfirmation.confirm,
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function MakeApplicationForkable({
  application,
}: {
  application: ApplicationPayload | undefined;
}) {
  const dispatch = useDispatch();
  const isFetchingApplication = useSelector(getIsFetchingApplications);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const onChangeInit = () => {
    if (!application?.forkingEnabled) {
      setShowConfirmationModal(true);
    } else {
      onChangeConfirm();
    }
  };

  const onChangeConfirm = () => {
    setShowConfirmationModal(false);
    application &&
      dispatch(
        updateApplication(application?.id, {
          forkingEnabled: !application?.forkingEnabled,
          currentApp: true,
        }),
      );
  };

  const closeModal = () => {
    setShowConfirmationModal(false);
  };

  return (
    <>
      <div className="px-4">
        <div className="pt-3 pb-2 font-medium text-[color:var(--appsmith-color-black-800)]">
          {createMessage(IN_APP_EMBED_SETTING.forkContentHeader)}
        </div>
      </div>
      <div className="px-4">
        <div className="flex justify-between items-center pb-4">
          <Switch
            data-testid={"forking-enabled-toggle"}
            isDisabled={isFetchingApplication}
            isSelected={!!application?.forkingEnabled}
            onChange={onChangeInit}
          >
            <PropertyHelpLabel
              label={createMessage(IN_APP_EMBED_SETTING.forkLabel)}
              lineHeight="1.17"
              maxWidth="270px"
              tooltip={createMessage(IN_APP_EMBED_SETTING.forkLabelTooltip)}
            />
          </Switch>
        </div>
      </div>
      <div
        className={`border-t-[1px] border-[color:var(--appsmith-color-black-300)]`}
      />
      <ConfirmEnableForkingModal
        isOpen={showConfirmationModal}
        onClose={closeModal}
        onConfirm={onChangeConfirm}
      />
    </>
  );
}

export default MakeApplicationForkable;
