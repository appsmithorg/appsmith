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
  updateCdConfigLoadingSelector,
} from "@appsmith/selectors/gitExtendedSelectors";
import {
  setShowDisableCDModalAction,
  updateCdConfigAction,
} from "@appsmith/actions/gitExtendedActions";
import { getGitMetadataSelector } from "selectors/gitSyncSelectors";
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
  const isUpdateCdConfigLoading = useSelector(updateCdConfigLoadingSelector);
  const gitMetadata = useSelector(getGitMetadataSelector);
  const cdConfigBranchName =
    gitMetadata?.autoDeploymentConfigs?.[0]?.branchName;

  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setShowDisableCDModalAction(false));
  };

  const handleDisable = () => {
    if (cdConfigBranchName) {
      dispatch(updateCdConfigAction(false, cdConfigBranchName));
      dispatch(setShowDisableCDModalAction(false));
      AnalyticsUtil.logEvent("GS_CONTINUOUS_DELIVERY_DISABLED", {
        deplymentTool: "others",
      });
    }
  };

  return (
    <Modal
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      open={showDisableCDModal}
    >
      <ModalContent
        data-testid="t--git-disable-cd-modal"
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
            data-testid="t--git-disable-cd-confirm-checkbox"
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
            className="t--git-disable-cd-modal-btn"
            isDisabled={!confirmed}
            isLoading={isUpdateCdConfigLoading}
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
