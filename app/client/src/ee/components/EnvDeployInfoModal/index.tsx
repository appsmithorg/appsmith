import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "design-system";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import {
  publishApplication,
  setWorkspaceIdForImport,
} from "@appsmith/actions/applicationActions";
import {
  getUserPreferenceFromStorage,
  setUserPreferenceInStorage,
} from "@appsmith/utils/Environments";
import EnvInfoModalBody from "./EnvInfoModalBody";
import {
  getCurrentEnvironmentDetails,
  isEnvInfoModalOpen,
} from "@appsmith/selectors/environmentSelectors";
import { hideEnvironmentDeployInfoModal } from "@appsmith/actions/environmentAction";
import {
  CANCEL,
  createMessage,
  DEPLOY,
  ENV_INFO_MODAL_CHECKBOX_LABEL,
  ENV_INFO_MODAL_HEADER,
} from "@appsmith/constants/messages";
import {
  getCurrentApplication,
  getIsPublishingApplication,
} from "selectors/editorSelectors";
import type { NavigationSetting } from "constants/AppConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: auto;
`;

const Footer = styled(ModalFooter)`
  height: 68px;
  align-items: center;
`;

export const EnvDeployInfoModal = () => {
  const [preferenceChecked, setPreferenceChecked] = useState(false);
  const [publishTriggered, setPublishTriggered] = useState(false);
  const isModalOpen = useSelector(isEnvInfoModalOpen);
  const currentApplication = useSelector(getCurrentApplication);
  const isPublishing = useSelector(getIsPublishingApplication);
  const currEnvDetails = useSelector(getCurrentEnvironmentDetails);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isPublishing && !publishTriggered) {
      setPublishTriggered(false);
    }
    if (!isPublishing && isModalOpen) {
      dispatch(hideEnvironmentDeployInfoModal());
    }
  }, [isPublishing, publishTriggered]);

  const handleClose = useCallback(() => {
    AnalyticsUtil.logEvent("CANCEL_DEPLOY_WITHOUT_GIT", {
      currentEnvName: currEnvDetails.name,
    });
    dispatch(hideEnvironmentDeployInfoModal());
    dispatch(setWorkspaceIdForImport(""));
    if (isPublishing) {
      dispatch({
        type: ReduxActionTypes.PUBLISH_APPLICATION_SUCCESS,
      });
    }
    if (preferenceChecked) {
      setUserPreferenceInStorage();
    }
  }, [dispatch, hideEnvironmentDeployInfoModal, preferenceChecked]);

  const handlePublish = () => {
    const applicationId = currentApplication?.id;
    if (applicationId) {
      dispatch(publishApplication(applicationId));

      if (preferenceChecked) {
        setUserPreferenceInStorage();
      }

      const appName = currentApplication ? currentApplication.name : "";
      const pageCount = currentApplication?.pages?.length;
      const navigationSettingsWithPrefix: Record<
        string,
        NavigationSetting[keyof NavigationSetting]
      > = {};

      if (currentApplication?.applicationDetail?.navigationSetting) {
        const settingKeys = Object.keys(
          currentApplication.applicationDetail.navigationSetting,
        ) as Array<keyof NavigationSetting>;

        settingKeys.map((key: keyof NavigationSetting) => {
          if (currentApplication?.applicationDetail?.navigationSetting?.[key]) {
            const value: NavigationSetting[keyof NavigationSetting] =
              currentApplication.applicationDetail.navigationSetting[key];

            navigationSettingsWithPrefix[`navigationSetting_${key}`] = value;
          }
        });
      }

      AnalyticsUtil.logEvent("PUBLISH_APP", {
        appId: applicationId,
        appName,
        pageCount,
        ...navigationSettingsWithPrefix,
        isPublic: !!currentApplication?.isPublic,
      });
    }
  };

  if (getUserPreferenceFromStorage() === "true") {
    return null;
  }

  const onToggleCheckbox = (checked: boolean) => {
    checked &&
      AnalyticsUtil.logEvent("DEPLOY_WITH_GIT_DISMISS_ENV_MESSAGE", {
        currentEnvName: currEnvDetails.name,
      });
    setPreferenceChecked(checked);
  };

  const renderFooter = () => {
    return (
      <Footer>
        <CheckboxContainer>
          <Checkbox
            data-testid="t--env-info-dismiss-checkbox"
            isSelected={preferenceChecked}
            onChange={onToggleCheckbox}
          >
            {createMessage(ENV_INFO_MODAL_CHECKBOX_LABEL)}
          </Checkbox>
        </CheckboxContainer>
        <Button
          kind="tertiary"
          onClick={() => {
            handleClose();
          }}
          size="md"
        >
          {createMessage(CANCEL)}
        </Button>
        <Button
          data-testid="t--env-info-modal-deploy-button"
          isLoading={isPublishing}
          kind="primary"
          onClick={() => {
            handlePublish();
          }}
          size="md"
        >
          {createMessage(DEPLOY)}
        </Button>
      </Footer>
    );
  };

  return (
    <Modal
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      open={isModalOpen}
    >
      <ModalContent data-testid="t--env-info-modal">
        <ModalHeader>{createMessage(ENV_INFO_MODAL_HEADER)}</ModalHeader>
        <EnvInfoModalBody />
        {renderFooter()}
      </ModalContent>
    </Modal>
  );
};
