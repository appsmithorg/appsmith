import React, { useCallback, useState } from "react";
import styled from "styled-components";

import AddDeployKey, { type AddDeployKeyProps } from "./AddDeployKey";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import ChooseGitProvider from "./ChooseGitProvider";
import GenerateSSH from "./GenerateSSH";
import Steps from "./Steps";
import Statusbar from "../Statusbar";
import { Button, ModalBody, ModalFooter } from "@appsmith/ads";
import { GIT_CONNECT_STEPS } from "./constants";
import type { GitProvider } from "./ChooseGitProvider";
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
import type { ApiResponse } from "api/ApiResponses";

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

interface FormDataState {
  gitProvider?: GitProvider;
  gitEmptyRepoExists?: string;
  gitExistingRepoExists?: boolean;
  remoteUrl?: string;
  isAddedDeployKey?: boolean;
  sshKeyType?: "RSA" | "ECDSA";
}

interface GitProfile {
  authorName: string;
  authorEmail: string;
  useDefaultProfile?: boolean;
}

interface ConnectOrImportPayload {
  remoteUrl: string;
  gitProfile: GitProfile;
}

interface ConnectOrImportProps {
  payload: ConnectOrImportPayload;
  onErrorCallback: (error: Error, response: ApiResponse<unknown>) => void;
}

// Remove comments after integration
interface ConnectModalProps {
  isImport?: boolean;
  // It replaces const isImportingViaGit in GitConnectionV2/index.tsx
  isImporting?: boolean;
  // Replaces dispatch(importAppFromGit)
  importFrom: (props: ConnectOrImportProps) => void;
  // Replaces connectToGit from useGitConnect hook
  connectTo: (props: ConnectOrImportProps) => void;
  // Replaces isConnectingToGit
  isConnectingTo?: boolean;
  isConnecting: boolean;
  artifactId: string;
  artifactType: string;
  // Replaces handleImport in original ChooseGitProvider.tsx
  onImportFromCalloutLinkClick: () => void;
  // Replaces hasCreateNewApplicationPermission = hasCreateNewAppPermission(workspace.userPermissions)
  canCreateNewArtifact: boolean;
  isModalOpen: boolean;
  deployKeyDocUrl: AddDeployKeyProps["deployKeyDocUrl"];
  isFetchingSSHKeyPair: AddDeployKeyProps["isFetchingSSHKeyPair"];
  fetchSSHKeyPair: AddDeployKeyProps["fetchSSHKeyPair"];
  generateSSHKey: AddDeployKeyProps["generateSSHKey"];
  isGeneratingSSHKey: AddDeployKeyProps["isGeneratingSSHKey"];
  sshKeyPair: AddDeployKeyProps["sshKeyPair"];
}

function ConnectModal({
  artifactId,
  artifactType,
  canCreateNewArtifact,
  connectTo,
  deployKeyDocUrl,
  fetchSSHKeyPair,
  generateSSHKey,
  importFrom,
  isConnecting = false,
  isFetchingSSHKeyPair,
  isGeneratingSSHKey,
  isImport = false,
  isImporting = false,
  isModalOpen,
  onImportFromCalloutLinkClick,
  sshKeyPair,
}: ConnectModalProps) {
  const [errorData, setErrorData] = useState<ApiResponse<unknown>>();

  const nextStepText = {
    [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: createMessage(CONFIGURE_GIT),
    [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]: createMessage(GENERATE_SSH_KEY_STEP),
    [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: createMessage(
      isImport ? IMPORT_APP_CTA : CONNECT_GIT_TEXT,
    ),
  };

  const [formData, setFormData] = useState<FormDataState>({
    gitProvider: undefined,
    gitEmptyRepoExists: undefined,
    gitExistingRepoExists: false,
    remoteUrl: undefined,
    isAddedDeployKey: false,
    sshKeyType: "ECDSA",
  });

  const handleChange = (partialFormData: Partial<FormDataState>) => {
    setFormData((s) => ({ ...s, ...partialFormData }));
  };

  const [activeStep, setActiveStep] = useState<string>(
    GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
  );
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
              connectTo({
                payload: {
                  remoteUrl: formData.remoteUrl,
                  gitProfile,
                },
                onErrorCallback: (error, response) => {
                  // AE-GIT-4033 is repo not empty error
                  if (response?.responseMeta?.error?.code === "AE-GIT-4033") {
                    setActiveStep(GIT_CONNECT_STEPS.GENERATE_SSH_KEY);
                  }

                  setErrorData(response);
                },
              });
              AnalyticsUtil.logEvent(
                "GS_CONNECT_BUTTON_ON_GIT_SYNC_MODAL_CLICK",
                { repoUrl: formData?.remoteUrl, connectFlow: "v2" },
              );
            } else {
              importFrom({
                payload: {
                  remoteUrl: formData.remoteUrl,
                  gitProfile,
                  // isDefaultProfile: true,
                },
                onErrorCallback(error, response) {
                  setErrorData(response);
                },
              });
            }
          }

          break;
        }
      }
    }
  }, [
    activeStep,
    connectTo,
    currentIndex,
    formData.remoteUrl,
    importFrom,
    isImport,
  ]);

  const stepProps = {
    onChange: handleChange,
    value: formData,
    isImport,
    errorData,
  };

  const loading = (!isImport && isConnecting) || (isImport && isImporting);

  return (
    <>
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
            {...stepProps}
            artifactId={artifactId}
            artifactType={artifactType}
            canCreateNewArtifact={canCreateNewArtifact}
            onImportFromCalloutLinkClick={onImportFromCalloutLinkClick}
          />
        )}
        {activeStep === GIT_CONNECT_STEPS.GENERATE_SSH_KEY && (
          <GenerateSSH {...stepProps} />
        )}
        {activeStep === GIT_CONNECT_STEPS.ADD_DEPLOY_KEY && (
          <AddDeployKey
            {...stepProps}
            connectLoading={loading}
            deployKeyDocUrl={deployKeyDocUrl}
            fetchSSHKeyPair={fetchSSHKeyPair}
            generateSSHKey={generateSSHKey}
            isFetchingSSHKeyPair={isFetchingSSHKeyPair}
            isGeneratingSSHKey={isGeneratingSSHKey}
            isModalOpen={isModalOpen}
            sshKeyPair={sshKeyPair}
          />
        )}
      </StyledModalBody>
      <StyledModalFooter loading={loading}>
        {loading && (
          <Statusbar
            completed={!loading}
            message={createMessage(
              isImport ? GIT_IMPORT_WAITING : GIT_CONNECT_WAITING,
            )}
          />
        )}
        {!loading && (
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
        {possibleSteps.includes(activeStep) && currentIndex > 0 && !loading && (
          <Button
            data-testid="t--git-connect-prev-button"
            isDisabled={loading}
            kind="secondary"
            onClick={handlePreviousStep}
            size="md"
            startIcon="arrow-left-s-line"
          >
            {createMessage(PREVIOUS_STEP)}
          </Button>
        )}
      </StyledModalFooter>
    </>
  );
}

export default ConnectModal;
