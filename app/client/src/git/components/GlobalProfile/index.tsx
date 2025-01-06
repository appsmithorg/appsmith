import useGlobalProfile from "git/hooks/useGlobalProfile";
import React from "react";
import GlobalProfileView from "./GlobalProfileView";

function GlobalProfile() {
  const {
    globalProfile,
    isFetchGlobalProfileLoading,
    isUpdateGlobalProfileLoading,
    updateGlobalProfile,
  } = useGlobalProfile();

  return (
    <GlobalProfileView
      globalProfile={globalProfile}
      isFetchGlobalProfileLoading={isFetchGlobalProfileLoading}
      isUpdateGlobalProfileLoading={isUpdateGlobalProfileLoading}
      updateGlobalProfile={updateGlobalProfile}
    />
  );
}

export default GlobalProfile;
