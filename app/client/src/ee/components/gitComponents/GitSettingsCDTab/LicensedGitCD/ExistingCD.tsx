import React, { useEffect, useState } from "react";
import LastDeployment from "./LastDeployment";
import { Divider } from "design-system";
import GenerateAPIKey from "./GenerateAPIKey";
import CDEndpoint from "./CDEndpoint";
import { useDispatch, useSelector } from "react-redux";
import { getDefaultGitBranchName } from "selectors/gitSyncSelectors";
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
  const [selectedBranch, setSelectedBranch] = useState<string>();
  const defaultBranchName = useSelector(getDefaultGitBranchName);

  const dispatch = useDispatch();

  const handleGenerateApiKey = () => {
    dispatch(setGitSettingsModalOpenAction({ open: false }));
    dispatch(setShowReconfigureCdKeyAction(true));
    AnalyticsUtil.logEvent("GS_CD_GENERATE_KEY_CLICKED", {
      deploymentTool: "others",
      regenerated: true,
    });
  };

  useEffect(() => {
    if (!selectedBranch && defaultBranchName) {
      setSelectedBranch(defaultBranchName);
    }
  }, [selectedBranch, defaultBranchName]);

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
        compact
        descText={createMessage(GIT_CD_ENDPOINT_DESC)}
        selectedBranch={selectedBranch || "BRANCH"}
        setSelectedBranch={setSelectedBranch}
      />
    </div>
  );
}

export default ExistingCD;
