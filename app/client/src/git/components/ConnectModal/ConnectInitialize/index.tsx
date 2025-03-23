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
import { isValidGitRemoteUrl } from "../../utils";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";
import noop from "lodash/noop";
import type { GitApiError } from "git/store/types";
import type { ConnectFormDataState } from "./types";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";
import { GitErrorCodes } from "git/constants/enums";
import { CONNECT_GIT, IMPORT_GIT } from "git/ee/constants/messages";

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
    text: CONNECT_GIT.CHOOSE_PROVIDER_STEP_TITLE,
  },
  {
    key: GIT_CONNECT_STEPS.GENERATE_SSH_KEY,
    text: CONNECT_GIT.GENERATE_SSH_KEY_STEP_TITLE,
  },
  {
    key: GIT_CONNECT_STEPS.ADD_DEPLOY_KEY,
    text: CONNECT_GIT.ADD_DEPLOY_KEY_STEP_TITLE,
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
    [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: CONNECT_GIT.CHOOSE_PROVIDER_CTA,
    [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]: CONNECT_GIT.GENERATE_SSH_KEY_CTA,
    [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: isImport
      ? IMPORT_GIT.IMPORT_CTA
      : CONNECT_GIT.CONNECT_CTA,
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
        {isImport ? IMPORT_GIT.MODAL_TITLE : CONNECT_GIT.MODAL_TITLE}
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
            message={isImport ? IMPORT_GIT.WAIT_TEXT : CONNECT_GIT.WAIT_TEXT}
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
              {CONNECT_GIT.PREV_STEP}
            </Button>
          )}
      </StyledModalFooter>
    </>
  );
}

export default ConnectInitialize;
