import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import AddDeployKey from "./AddDeployKey";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import ChooseGitProvider from "./ChooseGitProvider";
import GenerateSSH from "./GenerateSSH";
import Steps from "./Steps";
import Statusbar from "../../Statusbar";
import { Button, ModalBody, ModalFooter, ModalHeader } from "@appsmith/ads";
import { GIT_CONNECT_STEPS } from "./constants";
import {
  ADD_DEPLOY_KEY_STEP,
  CHOOSE_A_GIT_PROVIDER_STEP,
  CONFIGURE_GIT,
  CONNECT_GIT_TEXT,
  GENERATE_SSH_KEY_STEP,
  GIT_CONNECT_WAITING,
  GIT_IMPORT_WAITING,
  IMPORT_APP,
  IMPORT_APP_CTA,
  PREVIOUS_STEP,
  createMessage,
} from "ee/constants/messages";
import { isValidGitRemoteUrl } from "../../utils";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";
import noop from "lodash/noop";
import type { GitApiError } from "git/store/types";
import type { ConnectFormDataState } from "./types";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";
import { GitErrorCodes } from "git/constants/enums";

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

export interface ConnectInitializeProps {
  artifactType: string;
  error: GitApiError | null;
  isImport: boolean;
  isSSHKeyLoading: boolean;
  isSubmitLoading: boolean;
  onFetchSSHKey: () => void;
  onGenerateSSHKey: (keyType: string) => void;
  onOpenImport: (() => void) | null;
  onSubmit: (params: ConnectRequestParams | GitImportRequestParams) => void;
  sshPublicKey: string | null;
}

function ConnectInitialize({
  artifactType,
  error = null,
  isImport = false,
  isSSHKeyLoading = false,
  isSubmitLoading = false,
  onFetchSSHKey = noop,
  onGenerateSSHKey = noop,
  onOpenImport = null,
  onSubmit = noop,
  sshPublicKey = null,
}: ConnectInitializeProps) {
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

  // const isSubmitLoading =
  //   (!isImport && isConnectLoading) || (isImport && isGitImportLoading);

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
            onSubmit({
              remoteUrl: formData.remoteUrl,
              gitProfile,
            });
            // if (!isImport) {
            //   AnalyticsUtil.logEvent(
            //     "GS_CONNECT_BUTTON_ON_GIT_SYNC_MODAL_CLICK",
            //     { repoUrl: formData?.remoteUrl, connectFlow: "v2" },
            //   );
            //   connect({
            //     remoteUrl: formData.remoteUrl,
            //     gitProfile,
            //   });
            // } else {
            //   gitImport({
            //     remoteUrl: formData.remoteUrl,
            //     gitProfile,
            //   });
            // }
          }

          break;
        }
      }
    }
  }, [activeStep, currentIndex, formData.remoteUrl, onSubmit]);

  useEffect(
    function changeStepOnErrorEffect() {
      if (error?.code === GitErrorCodes.REPO_NOT_EMPTY) {
        setActiveStep(GIT_CONNECT_STEPS.GENERATE_SSH_KEY);
      }
    },
    [error?.code],
  );

  return (
    <>
      <ModalHeader>
        {isImport ? createMessage(IMPORT_APP) : createMessage(CONFIGURE_GIT)}
      </ModalHeader>
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
            onOpenImport={onOpenImport}
            value={formData}
          />
        )}
        {activeStep === GIT_CONNECT_STEPS.GENERATE_SSH_KEY && (
          <GenerateSSH error={error} onChange={handleChange} value={formData} />
        )}
        {activeStep === GIT_CONNECT_STEPS.ADD_DEPLOY_KEY && (
          <AddDeployKey
            error={error}
            isSSHKeyLoading={isSSHKeyLoading}
            isSubmitLoading={isSubmitLoading}
            onChange={handleChange}
            onFetchSSHKey={onFetchSSHKey}
            onGenerateSSHKey={onGenerateSSHKey}
            sshPublicKey={sshPublicKey}
            value={formData}
          />
        )}
      </StyledModalBody>
      <StyledModalFooter loading={isSubmitLoading}>
        {isSubmitLoading && (
          <Statusbar
            completed={!isSubmitLoading}
            message={createMessage(
              isImport ? GIT_IMPORT_WAITING : GIT_CONNECT_WAITING,
            )}
          />
        )}
        {!isSubmitLoading && (
          <Button
            data-testid="t--git-connect-next"
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
          !isSubmitLoading && (
            <Button
              data-testid="t--git-connect-prev-button"
              isDisabled={isSubmitLoading}
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

export default ConnectInitialize;
