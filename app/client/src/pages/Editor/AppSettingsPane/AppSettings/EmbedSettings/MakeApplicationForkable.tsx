import React, { useState } from "react";
import {
  DialogComponent,
  Switch,
  TextType,
  Text,
  Button,
  Category,
  Size,
} from "design-system-old";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import SwitchWrapper from "../../Components/SwitchWrapper";
import { useDispatch, useSelector } from "react-redux";
import { getIsFetchingApplications } from "@appsmith/selectors/applicationSelectors";
import { updateApplication } from "@appsmith/actions/applicationActions";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";

const StyledPropertyHelpLabel = styled(PropertyHelpLabel)`
  .bp3-popover-content > div {
    text-align: center;
    max-height: 44px;
    display: flex;
    align-items: center;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
`;

type ConfirmEnableForkingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function ConfirmEnableForkingModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmEnableForkingModalProps) {
  return (
    <DialogComponent
      isOpen={isOpen}
      onClose={onClose}
      title={createMessage(
        IN_APP_EMBED_SETTING.forkApplicationConfirmation.title,
      )}
    >
      <div id="confirm-fork-modal">
        <Text type={TextType.P1}>
          {createMessage(IN_APP_EMBED_SETTING.forkApplicationConfirmation.body)}
        </Text>

        <ButtonWrapper>
          <Button
            category={Category.secondary}
            onClick={onClose}
            size={Size.large}
            tag="button"
            text={createMessage(
              IN_APP_EMBED_SETTING.forkApplicationConfirmation.cancel,
            )}
            width={"142px"}
          />
          <Button
            category={Category.primary}
            data-cy={"allow-forking"}
            onClick={onConfirm}
            size={Size.large}
            tag="button"
            text={createMessage(
              IN_APP_EMBED_SETTING.forkApplicationConfirmation.confirm,
            )}
          />
        </ButtonWrapper>
      </div>
    </DialogComponent>
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
          <StyledPropertyHelpLabel
            label={createMessage(IN_APP_EMBED_SETTING.forkLabel)}
            lineHeight="1.17"
            maxWidth="270px"
            tooltip={createMessage(IN_APP_EMBED_SETTING.forkLabelTooltip)}
          />
          <SwitchWrapper>
            <Switch
              checked={!!application?.forkingEnabled}
              className="mb-0"
              data-cy="forking-enabled-toggle"
              disabled={isFetchingApplication}
              large
              onChange={onChangeInit}
            />
          </SwitchWrapper>
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
