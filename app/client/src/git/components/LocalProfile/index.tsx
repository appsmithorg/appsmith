import React from "react";
import LocalProfileView from "./LocalProfileView";
import useLocalProfile from "git/hooks/useLocalProfile";
import useGlobalProfile from "git/hooks/useGlobalProfile";

function LocalProfile() {
  const { isFetchLocalProfileLoading, localProfile, updateLocalProfile } =
    useLocalProfile();

  const { globalProfile, isFetchGlobalProfileLoading } = useGlobalProfile();

  return (
    <LocalProfileView
      globalProfile={globalProfile}
      isFetchGlobalProfileLoading={isFetchGlobalProfileLoading}
      isFetchLocalProfileLoading={isFetchLocalProfileLoading}
      localProfile={localProfile}
      updateLocalProfile={updateLocalProfile}
    />
  );
}

export default LocalProfile;
