import React from "react";
import LastDeployment from "./LastDeployment";
import { Divider } from "design-system";
import GenerateAPIKey from "./GenerateAPIKey";
import CDEndpoint from "./CDEndpoint";
import { useDispatch, useSelector } from "react-redux";
import { getGitMetadataSelector } from "selectors/gitSyncSelectors";
import { setShowReconfigureCdKeyAction } from "@appsmith/actions/gitExtendedActions";
import { setGitSettingsModalOpenAction } from "actions/gitSyncActions";
import {
  GIT_CD_ENDPOINT_DESC,
  GIT_CD_RECONFIGURE_API_KEY_CTA,
  GIT_CD_RECONFIGURE_API_KEY_DESC,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";

function ExistingCD() {
  const dispatch = useDispatch();

  const gitMetadata = useSelector(getGitMetadataSelector);
  const cdConfigBranchName =
    gitMetadata?.autoDeploymentConfigs?.[0]?.branchName;

  const handleGenerateApiKey = () => {
    dispatch(setGitSettingsModalOpenAction({ open: false }));
    dispatch(setShowReconfigureCdKeyAction(true));
    AnalyticsUtil.logEvent("GS_CD_GENERATE_KEY_CLICKED", {
      deploymentTool: "others",
      regenerated: true,
    });
  };

  return (
    <div className="pt-2">
      <LastDeployment />
      <Divider className="d-block mt-6 mb-6" />
      <GenerateAPIKey
        compact
        ctaText={createMessage(GIT_CD_RECONFIGURE_API_KEY_CTA)}
        descText={createMessage(GIT_CD_RECONFIGURE_API_KEY_DESC)}
        onClickOverride={handleGenerateApiKey}
      />
      <CDEndpoint
        branchName={cdConfigBranchName}
        compact
        descText={createMessage(GIT_CD_ENDPOINT_DESC)}
      />
    </div>
  );
}

export default ExistingCD;
