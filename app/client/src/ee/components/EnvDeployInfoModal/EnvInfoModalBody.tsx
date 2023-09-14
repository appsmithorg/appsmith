import React from "react";
import { Button, Link, Text } from "design-system";
import InfoContent from "../EnvInfoHeader/InfoContent";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  ENV_INFO_MODAL_DESCRIPTION,
  ENV_INFO_MODAL_DOCUMENATION_LINK_TEXT,
} from "@appsmith/constants/messages";
import { hideEnvironmentDeployInfoModal } from "@appsmith/actions/environmentAction";

const LinkToDocumnetation = styled(Link)`
  margin-top: 8px;
  margin-bottom: 16px;
`;

const ConnectGitButton = styled(Button)`
  margin-top: 8px;
  max-width: fit-content;
`;

const DOCUMENTATION_URL =
  "https://docs.appsmith.com/connect-data/concepts/Datasource-Environments";

export default function EnvInfoModalBody() {
  const dispatch = useDispatch();
  return (
    <>
      <InfoContent />
      <LinkToDocumnetation target="_blank" to={DOCUMENTATION_URL}>
        {createMessage(ENV_INFO_MODAL_DOCUMENATION_LINK_TEXT)}
      </LinkToDocumnetation>
      <Text kind="body-m">{createMessage(ENV_INFO_MODAL_DESCRIPTION)}</Text>
      <ConnectGitButton
        kind="secondary"
        onClick={() => {
          dispatch(hideEnvironmentDeployInfoModal());
          dispatch(
            setIsGitSyncModalOpen({
              isOpen: true,
              tab: GitSyncModalTab.GIT_CONNECTION,
              isDeploying: true,
            }),
          );
          AnalyticsUtil.logEvent("GS_SETTING_CLICK", {
            source: "BOTTOM_BAR_GIT_SETTING_BUTTON",
          });
        }}
        size="md"
        startIcon="github-fill"
      >
        Connect Git
      </ConnectGitButton>
    </>
  );
}
