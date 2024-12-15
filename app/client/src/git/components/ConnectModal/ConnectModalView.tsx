import React, { useCallback, useState } from "react";
import styled from "styled-components";

import AddDeployKey from "./AddDeployKey";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import ChooseGitProvider from "./ChooseGitProvider";
import GenerateSSH from "./GenerateSSH";
import Steps from "./Steps";
import Statusbar from "../Statusbar";
import { Button, Modal, ModalBody, ModalFooter } from "@appsmith/ads";
import { GIT_CONNECT_STEPS } from "./constants";
import {
  ADD_DEPLOY_KEY_STEP,
  CHOOSE_A_GIT_PROVIDER_STEP,
  CONFIGURE_GIT,
  CONNECT_GIT_TEXT,
  GENERATE_SSH_KEY_STEP,
  GIT_CONNECT_WAITING,
  GIT_IMPORT_WAITING,
  IMPORT_APP_CTA,
  PREVIOUS_STEP,
  createMessage,
} from "ee/constants/messages";
import { isValidGitRemoteUrl } from "../utils";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";
import noop from "lodash/noop";
import type { GitApiError } from "git/store/types";
import type { ConnectFormDataState } from "./types";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";

const OFFSET = 200;
const OUTER_PADDING = 32;
const FOOTER = 56;
const HEADER = 44;

const StyledModalBody = styled(ModalBody)`
  flex: 1;
  overflow-y: initial;
  display: flex;
  flex-direction: column;
  max-height: calc(
    100vh - ${OFFSET}px - ${OUTER_PADDING}px - ${FOOTER}px - ${HEADER}px
  );
`;

const StyledModalFooter = styled(ModalFooter)<StyledModalFooterProps>`
  justify-content: space-between;
  flex-direction: ${(p) => (!p.loading ? "row-reverse" : "row")};
`;

const steps = [
  {
    key: GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
    text: createMessage(CHOOSE_A_GIT_PROVIDER_STEP),
  },
  {
    key: GIT_CONNECT_STEPS.GENERATE_SSH_KEY,
    text: createMessage(GENERATE_SSH_KEY_STEP),
  },
  {
    key: GIT_CONNECT_STEPS.ADD_DEPLOY_KEY,
    text: createMessage(ADD_DEPLOY_KEY_STEP),
  },
];

const possibleSteps = steps.map((s) => s.key);

interface StyledModalFooterProps {
  loading?: boolean;
}

interface ConnectModalViewProps {
  artifactType: string;
  connect: (params: ConnectRequestParams) => void;
  connectError: GitApiError | null;
  fetchSSHKey: () => void;
  generateSSHKey: (keyType: string) => void;
  gitImport: (params: GitImportRequestParams) => void;
  isConnectLoading: boolean;
  isConnectModalOpen: boolean;
  isFetchSSHKeyLoading: boolean;
  isGenerateSSHKeyLoading: boolean;
  isGitImportLoading: boolean;
  isImport: boolean;
  sshPublicKey: string | null;
  toggleConnectModal: (open: boolean) => void;
}

function ConnectModalView({
  artifactType,
  connect = noop,
  connectError = null,
  fetchSSHKey = noop,
  generateSSHKey = noop,
  gitImport = noop,
  isConnectLoading = false,
  isConnectModalOpen = false,
  isFetchSSHKeyLoading = false,
  isGenerateSSHKeyLoading = false,
  isGitImportLoading = false,
  isImport = false,
  sshPublicKey = null,
  toggleConnectModal = noop,
  // isCreateArtifactPermitted = false,
  // onImportFromCalloutLinkClick,
}: ConnectModalViewProps) {
  const nextStepText = {
    [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: createMessage(CONFIGURE_GIT),
    [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]: createMessage(GENERATE_SSH_KEY_STEP),
    [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: createMessage(
      isImport ? IMPORT_APP_CTA : CONNECT_GIT_TEXT,
    ),
  };

  const [formData, setFormData] = useState<ConnectFormDataState>({
    gitProvider: undefined,
    gitEmptyRepoExists: undefined,
    gitExistingRepoExists: false,
    remoteUrl: undefined,
    isAddedDeployKey: false,
    sshKeyType: "ECDSA",
  });

  const [activeStep, setActiveStep] = useState<string>(
    GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
  );

  const isLoading =
    (!isImport && isConnectLoading) || (isImport && isGitImportLoading);

  const currentIndex = steps.findIndex((s) => s.key === activeStep);

  const isDisabled = {
    [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: !isImport
      ? !formData.gitProvider ||
        !formData.gitEmptyRepoExists ||
        formData.gitEmptyRepoExists === "no"
      : !formData.gitProvider || !formData.gitExistingRepoExists,
    [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]:
      typeof formData?.remoteUrl !== "string" ||
      !isValidGitRemoteUrl(formData?.remoteUrl),
    [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: !formData.isAddedDeployKey,
  };

  const handleChange = useCallback(
    (partialFormData: Partial<ConnectFormDataState>) => {
      setFormData((s) => ({ ...s, ...partialFormData }));
    },
    [],
  );

  const handlePreviousStep = useCallback(() => {
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1].key);
    }
  }, [currentIndex]);

  const handleNextStep = useCallback(() => {
    if (currentIndex < steps.length) {
      switch (activeStep) {
        case GIT_CONNECT_STEPS.CHOOSE_PROVIDER: {
          setActiveStep(GIT_CONNECT_STEPS.GENERATE_SSH_KEY);
          AnalyticsUtil.logEvent("GS_CONFIGURE_GIT");
          break;
        }
        case GIT_CONNECT_STEPS.GENERATE_SSH_KEY: {
          setActiveStep(GIT_CONNECT_STEPS.ADD_DEPLOY_KEY);
          AnalyticsUtil.logEvent("GS_GENERATE_KEY_BUTTON_CLICK", {
            repoUrl: formData?.remoteUrl,
            connectFlow: "v2",
          });
          break;
        }
        case GIT_CONNECT_STEPS.ADD_DEPLOY_KEY: {
          const gitProfile = {
            authorName: "",
            authorEmail: "",
            useGlobalProfile: true,
          };

          if (formData.remoteUrl) {
            if (!isImport) {
              AnalyticsUtil.logEvent(
                "GS_CONNECT_BUTTON_ON_GIT_SYNC_MODAL_CLICK",
                { repoUrl: formData?.remoteUrl, connectFlow: "v2" },
              );
              connect({
                remoteUrl: formData.remoteUrl,
                gitProfile,
                // ! case: connect doesnt support error callback. use effect instead
                // onErrorCallback: (error, response) => {
                //   if (response?.responseMeta?.error?.code === "AE-GIT-4033") {
                //     setActiveStep(GIT_CONNECT_STEPS.GENERATE_SSH_KEY);
                //   }
                // }
              });
            } else {
              gitImport({
                remoteUrl: formData.remoteUrl,
                gitProfile,
              });
            }
          }

          break;
        }
      }
    }
  }, [
    activeStep,
    connect,
    currentIndex,
    formData.remoteUrl,
    gitImport,
    isImport,
  ]);

  const handleModalOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        toggleConnectModal(false);
      }
    },
    [toggleConnectModal],
  );

  return (
    <Modal onOpenChange={handleModalOpenChange} open={isConnectModalOpen}>
      <StyledModalBody>
        {possibleSteps.includes(activeStep) && (
          <Steps
            activeKey={activeStep}
            onActiveKeyChange={setActiveStep}
            steps={steps}
          />
        )}
        {activeStep === GIT_CONNECT_STEPS.CHOOSE_PROVIDER && (
          <ChooseGitProvider
            artifactType={artifactType}
            isImport={isImport}
            onChange={handleChange}
            value={formData}
            // isCreateArtifactPermitted={isCreateArtifactPermitted}
            // onImportFromCalloutLinkClick={onImportFromCalloutLinkClick}
          />
        )}
        {activeStep === GIT_CONNECT_STEPS.GENERATE_SSH_KEY && (
          <GenerateSSH
            connectError={connectError}
            onChange={handleChange}
            value={formData}
          />
        )}
        {activeStep === GIT_CONNECT_STEPS.ADD_DEPLOY_KEY && (
          <AddDeployKey
            connectError={connectError}
            fetchSSHKey={fetchSSHKey}
            generateSSHKey={generateSSHKey}
            isConnectModalOpen={isConnectModalOpen}
            isFetchSSHKeyLoading={isFetchSSHKeyLoading}
            isGenerateSSHKeyLoading={isGenerateSSHKeyLoading}
            isLoading={isLoading}
            onChange={handleChange}
            sshPublicKey={sshPublicKey}
            value={formData}
          />
        )}
      </StyledModalBody>
      <StyledModalFooter loading={isLoading}>
        {isLoading && (
          <Statusbar
            completed={!isLoading}
            message={createMessage(
              isImport ? GIT_IMPORT_WAITING : GIT_CONNECT_WAITING,
            )}
          />
        )}
        {!isLoading && (
          <Button
            data-testid="t--git-connect-next-button"
            endIcon={
              currentIndex < steps.length - 1 ? "arrow-right-s-line" : undefined
            }
            isDisabled={isDisabled[activeStep]}
            onClick={handleNextStep}
            size="md"
          >
            {nextStepText[activeStep]}
          </Button>
        )}
        {possibleSteps.includes(activeStep) &&
          currentIndex > 0 &&
          !isLoading && (
            <Button
              data-testid="t--git-connect-prev-button"
              isDisabled={isLoading}
              kind="secondary"
              onClick={handlePreviousStep}
              size="md"
              startIcon="arrow-left-s-line"
            >
              {createMessage(PREVIOUS_STEP)}
            </Button>
          )}
      </StyledModalFooter>
    </Modal>
  );
}

export default ConnectModalView;
