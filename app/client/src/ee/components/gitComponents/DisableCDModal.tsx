import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "design-system";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  showDisableCdModalSelector,
  toggleCdLoadingSelector,
} from "@appsmith/selectors/gitExtendedSelectors";
import {
  setShowDisableCDModalAction,
  toggleCdConfigAction,
} from "@appsmith/actions/gitExtendedActions";
import styled from "styled-components";
import {
  createMessage,
  GIT_CD_CONFIRM_DISABLE_CD,
  GIT_CD_DISABLE_CD,
  GIT_CD_DISABLE_CD_DESC,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";

const StyledCheckbox = styled(Checkbox)`
  flex: 1;
`;

const DescText = styled(Text)`
  margin-bottom: 16px;
`;

function DisableCDModal() {
  const [confirmed, setConfirmed] = useState(false);

  const showDisableCDModal = useSelector(showDisableCdModalSelector);
  const toggleCdLoading = useSelector(toggleCdLoadingSelector);

  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setShowDisableCDModalAction(false));
  };

  const handleDisable = () => {
    dispatch(toggleCdConfigAction());
    dispatch(setShowDisableCDModalAction(false));
    AnalyticsUtil.logEvent("GS_CONTINUOUS_DELIVERY_DISABLED", {
      deplymentTool: "others",
    });
  };

  return (
    <Modal
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      open={showDisableCDModal}
    >
      <ModalContent
        data-testid="t--cd-disable-modal"
        style={{ width: "640px" }}
      >
        <ModalHeader style={{ margin: 0 }}>
          {createMessage(GIT_CD_DISABLE_CD)}
        </ModalHeader>
        <ModalBody>
          <DescText renderAs="p">
            {createMessage(GIT_CD_DISABLE_CD_DESC)}
          </DescText>
          <StyledCheckbox
            data-testid="t--cd-disable-confirm-checkbox"
            isSelected={confirmed}
            onChange={(isSelected) => {
              setConfirmed(isSelected);
            }}
          >
            <Text renderAs="p">{createMessage(GIT_CD_CONFIRM_DISABLE_CD)}</Text>
          </StyledCheckbox>
        </ModalBody>
        <ModalFooter>
          <Button
            data-testid="t--cd-disable-confirm-btn"
            isDisabled={!confirmed}
            isLoading={toggleCdLoading}
            kind="primary"
            onClick={handleDisable}
            size="md"
          >
            {createMessage(GIT_CD_DISABLE_CD)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DisableCDModal;
