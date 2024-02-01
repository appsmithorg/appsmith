import React from "react";
import { useSelector } from "react-redux";
import { getGitMetadataSelector } from "selectors/gitSyncSelectors";
import InitializeCD from "./InitializeCD";
import ExistingCD from "./ExistingCD";

function LicensedCD() {
  const gitMetadata = useSelector(getGitMetadataSelector);
  const isCdConfigInitialized = gitMetadata?.isAutoDeploymentEnabled;

  if (isCdConfigInitialized) return <ExistingCD />;

  return <InitializeCD />;
}

export default LicensedCD;
